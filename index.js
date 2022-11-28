const path = require('path')
const { program } = require('commander')
const { chromium } = require('playwright')
const { Cron } = require('croner')

program
  .requiredOption('-u, --user <string>', '统一认证学号')
  .requiredOption('-p, --password <string>', '统一认证密码')
  .option('--daily', '每日8点与13点时随机延迟并打卡')
  .option('--delay <number>', '随机延迟最大值，单位秒')
  .option('--proxy <string>', '代理，形如：socks5://127.0.0.1:1080')
  .option('--bark <string>', 'bark推送链接')

const options = program.parse().opts()
console.log(options)


main()

async function main() {
  if (!options.daily) {
    await dk(options.user, options.password)
    return
  }

  const job = Cron('0 8,13 * * *', { timezone: "Asia/Shanghai" }, async () => {
    if (options.delay) {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const seconds = Math.floor(Math.random() * Number.parseInt(options.delay))
      console.log('延迟', seconds)
      await sleep(seconds * 1000)
    }

    await dk(options.user, options.password)
    console.log('下次预计', job.next().toLocaleTimeString("zh-CN"))
  })
  console.log('每日打卡已启动，下次预计', job.next().toLocaleTimeString("zh-CN"))
}


async function dk(user, password) {
  console.log(user, password)

  const browser = await chromium.launch({
    args: options.proxy && [`--proxy-server=${options.proxy}`]
  })
  const context = await browser.newContext({ locale: 'zh-CN' })

  // 推送通知
  async function bark(title, content) {
    console.log(title, content)

    if (!options.bark) return

    const page = await context.newPage()
    await page.goto(`${options.bark}/${title}/${content}`)
    await page.waitForLoadState('networkidle')
    await page.close()
  }

  const pageScreenCaptor = (dirPath = '.') => {
    let index = 0
    return async (page) => {
      await page.screenshot({ path: path.join(dirPath, `${++index}.png`) })
    }
  }
  const screenshot = pageScreenCaptor('screenshots')

  try {
    const page = await context.newPage()
    await page.goto('https://ids.xmu.edu.cn/authserver/login?service=https://xmuxg.xmu.edu.cn/login/cas/xmu')
    await screenshot(page)

    await page.fill('[placeholder="用户名"]', user)
    await page.fill('[placeholder="密码"]', password)
    await screenshot(page)

    await page.click('button:has-text("登录")')
    await page.waitForLoadState('networkidle')
    await screenshot(page)

    // 打开应用
    await page.goto('https://xmuxg.xmu.edu.cn/app/214')
    await screenshot(page)

    // 等待表单加载
    await page.click('text=我的表单')
    await page.waitForLoadState('networkidle')
    await screenshot(page)

    // 点击下拉菜单
    try {
      // await page.click('#address_1582538163410 >> .v-select >> nth=0')
      // await page.click('label[title="福建省"]')

      // await page.click('#address_1582538163410 >> .v-select >> nth=1')
      // await page.click('label[title="厦门市"]')

      // await page.click('#address_1582538163410 >> .v-select >> nth=2')
      // await page.click('label[title="思明区"]')

      await page.click('#select_1582538939790 >> text=请选择')
      await page.click('label[title="是 Yes"]')
    } catch (err) {
      page.close()
      await bark('健康打卡', `已打卡过 ${user}`)
      return
    }
    await screenshot(page)

    // 保存
    page.once('dialog', dialog => dialog.accept())
    await page.click('.form-save:has-text("保存")')
    await page.waitForSelector('.message:has-text("保存成功")')
    await screenshot(page)
    await page.close()

    await bark('健康打卡', `打卡完成 ${user}`)
  } catch (err) {
    await bark('健康打卡', `打卡失败 ${user} ${err}`)
    process.exit(1)
  } finally {
    await context.close()
    await browser.close()
  }
}
