## 厦门大学每日健康打卡

## Docker

```bash
# 查看帮助
docker run wangzexi/xmu-dk -h

# 执行一次打卡后退出
docker run wangzexi/xmu-dk -u 30920991113333 -p 123456

# 持续运行，并于每日8点和13点执行打卡
docker run wangzexi/xmu-dk -u 30920991113333 -p 123456 --daily

# 持续运行，并于每日8点与13点时随机延迟最大3600秒后执行打卡
docker run wangzexi/xmu-dk -u 30920991113333 -p 123456 --daily --delay 3600

# 推荐docker run运行
# --rm: 容器退出后自动移除
# -d: 容器后台运行
# --restart=unless-stopped: 自动启动容器
docker run --rm -d --restart=unless-stopped wangzexi/xmu-dk -u 30920991113333 -p 123456 --daily

# 使用socks5代理执行打卡
docker run wangzexi/xmu-dk -u 30920991113333 -p 123456 --proxy socks5://127.0.0.1:1080
```
