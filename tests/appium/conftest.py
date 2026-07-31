"""
IMPORTANT SCOPE NOTE:
Appium is built for automating native/hybrid mobile apps. NestDirect is a
responsive web app, not a native app — there is no .apk/.ipa to install.
The correct way to point Appium at a website is to drive the mobile
browser (Chrome on an Android emulator) via Appium's UiAutomator2 driver,
which is what this suite does. This gives you real mobile-Chrome, touch-driven
coverage distinct from desktop Selenium (viewport, touch target sizes,
mobile Chrome rendering quirks) — but note it is inherently slower and more
infrastructure-heavy than Selenium, since it requires a booted Android
emulator. For production CI, a device cloud (BrowserStack App Automate /
Sauce Labs) is more reliable than booting an emulator in GitHub Actions —
see the workflow file for both options.
"""
import os
import pytest
from appium import webdriver as appium_webdriver
from appium.options.android import UiAutomator2Options

BASE_URL = os.environ.get("BASE_URL", "https://nest-direct-webapp.vercel.app")
APPIUM_SERVER = os.environ.get("APPIUM_SERVER", "http://127.0.0.1:4723")


@pytest.fixture
def mobile_driver():
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"
    options.browser_name = "Chrome"
    options.set_capability("appium:deviceName", "Android Emulator")
    options.set_capability("appium:chromedriverExecutable", os.environ.get("CHROMEDRIVER_PATH", ""))
    options.set_capability("appium:newCommandTimeout", 120)

    drv = appium_webdriver.Remote(APPIUM_SERVER, options=options)
    yield drv
    drv.quit()


@pytest.fixture
def base_url():
    return BASE_URL
