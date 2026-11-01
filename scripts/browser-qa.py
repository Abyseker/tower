"""Optional local Chromium QA. Needs Python Playwright and a running server."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('EOUS_QA_URL','http://127.0.0.1:4173')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1536,'height':1080},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  response=await page.goto(URL,wait_until='networkidle');assert response.status==200
  await page.screenshot(path=str(ROOT/'demo-intro.png'),full_page=True)
  await page.keyboard.press('Enter');await page.keyboard.press('Enter')
  await page.wait_for_timeout(500)
  await page.screenshot(path=str(ROOT/'demo-game.png'),full_page=True)
  # All interaction below uses keys; evaluate only supplies isolated encounter fixtures.
  for _ in range(4):await page.keyboard.press('ArrowRight');await page.wait_for_timeout(130)
  await page.keyboard.press('ArrowDown')
  assert '妮可布' in await page.locator('#overlay').inner_text()
  await page.keyboard.press('2')
  assert await page.locator('#overlay').inner_text()==''
  for key in ['i','j','m','p','b','h']:
   await page.keyboard.press(key);assert await page.get_by_role('dialog').count()==1
   if key=='b':
    assert await page.locator('.gallery-grid img').count()==18
    await page.screenshot(path=str(ROOT/'demo-gallery.png'),full_page=True)
   await page.keyboard.press('PageDown');await page.keyboard.press('Escape')
  await page.keyboard.press('F5');await page.keyboard.press('ArrowRight');await page.keyboard.press('F9')
  assert '读取' not in await page.locator('#overlay').inner_text()
  await page.evaluate("""async()=>{const {fresh}=await import('./src/engine.js');const {generate}=await import('./src/world.js');const s=fresh();s.floor=5;s.maps[5]=generate(5);s.visited=[1,5];const b=s.maps[5].bossAt;s.x=b.x;s.y=b.y-1;s.face='down';s.atk=100;s.def=50;s.level=10;s.hp=s.maxHp=800;localStorage.setItem('eous-dream-v3',JSON.stringify(s))}""")
  await page.keyboard.press('F9');await page.keyboard.press('f')
  assert '塔纳托斯' in await page.locator('#overlay').inner_text()
  await page.screenshot(path=str(ROOT/'demo-combat.png'),full_page=True)
  await page.keyboard.press('e');assert '取消水平斩' in await page.locator('#overlay').inner_text()
  await page.keyboard.press('3');assert await page.locator('#overlay').inner_text()==''
  await page.keyboard.press('f');await page.keyboard.press('4')
  for key in ['ArrowUp','ArrowLeft','ArrowDown']:await page.keyboard.press(key)
  assert '机制引导 3/3' in await page.locator('#overlay').inner_text()
  await page.keyboard.press('Escape');await page.wait_for_timeout(200)
  assert not errors,errors
  assert await page.locator('img').evaluate_all('(ims)=>ims.every(i=>i.complete&&i.naturalWidth>0)')
  print(json.dumps({'page_errors':errors,'keyboard_screens':9,'image_loading':'passed','boss_input':'passed'},ensure_ascii=False))
  await browser.close()
asyncio.run(main())
