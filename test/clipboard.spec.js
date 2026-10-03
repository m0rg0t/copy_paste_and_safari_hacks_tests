const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8').replace('<script src="./clipboard.js"></script>','');
const script=fs.readFileSync('clipboard.js','utf8');
test.beforeEach(async({page})=>{
 await page.route('**/*',route=>route.abort());
 await page.setContent(html);await page.addScriptTag({content:script});
 await page.evaluate(()=>{
  window.reads=0;window.revoked=[];window.created=[];
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
  URL.createObjectURL=blob=>{const url=create(blob);window.created.push(url);return url;};
  URL.revokeObjectURL=url=>{window.revoked.push(url);revoke(url);};
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{read:async()=>{window.reads++;throw Error('synthetic denial');}}});
 });
});
async function paste(page,values={}) {await page.evaluate(({plain='',html='',imageCount=0})=>{
 const data=new DataTransfer();if(plain)data.setData('text/plain',plain);if(html)data.setData('text/html',html);
 for(let i=0;i<imageCount;i++)data.items.add(new File([new Uint8Array([0])],`synthetic-${i}.png`,{type:'image/png'}));
 const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:data});document.dispatchEvent(event);
 },values);}
test('event text and HTML remain literal, with no clipboard read',async({page},info)=>{
 await paste(page,{plain:'<img src=x onerror=alert(1)>',html:'<b>ignored</b>'});
 await expect(page.locator('#output p')).toHaveText('<img src=x onerror=alert(1)>');await expect(page.locator('#output img')).toHaveCount(0);
 await paste(page,{html:'<script>window.attacked=true</script>'});await expect(page.locator('#output p').first()).toHaveText('<script>window.attacked=true</script>');
 expect(await page.evaluate(()=>window.reads)).toBe(0);expect(await page.evaluate(()=>window.attacked)).toBeUndefined();
 await page.screenshot({path:info.outputPath('synthetic-text.png'),fullPage:true});
});
test('multiple images release object URLs and clear resets output',async({page})=>{
 await paste(page,{imageCount:2});await expect(page.locator('#output img')).toHaveCount(2);
 await page.evaluate(()=>document.querySelectorAll('#output img').forEach(img=>img.dispatchEvent(new Event('error'))));
 expect(await page.evaluate(()=>window.revoked.length)).toBe(2);await page.getByText('Clear pasted content').click();await expect(page.locator('#output > *')).toHaveCount(0);
 expect(await page.evaluate(()=>new Set(window.revoked).size)).toBe(2);
});
test('denied and absent API are handled without unhandled rejection',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await paste(page);await expect(page.getByRole('status')).toContainText('denied');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined}));await paste(page);await expect(page.getByRole('status')).toContainText('No supported');expect(errors).toEqual([]);
});
test('synthetic async items and clear cancel stale results',async({page})=>{
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{read:async()=>[{types:['text/html','text/plain'],getType:async type=>new Blob([type==='text/plain'?'Synthetic plain':'<b>HTML</b>'],{type})}]}}));
 await paste(page);await expect(page.locator('#output p')).toHaveText('Synthetic plain');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{read:()=>new Promise(resolve=>{window.resolveClipboard=resolve;})}}));
 await paste(page);await page.getByText('Clear pasted content').click();await page.evaluate(()=>window.resolveClipboard([{types:['text/plain'],getType:async()=>new Blob(['stale'])}]));
 await expect(page.locator('#output > *')).toHaveCount(0);
});
