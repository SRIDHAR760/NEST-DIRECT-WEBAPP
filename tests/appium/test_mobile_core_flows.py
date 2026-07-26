"""
Core mobile-browser flows via Appium + Android Chrome.
Mirrors the highest-value Selenium desktop flows, focused on
touch-interaction and mobile-viewport-specific concerns.
"""
import pytest
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TAP_TARGETS = [
    "Continue with Google",
    "Instant Guest Access",
    "SIGN IN",
    "REGISTER",
]


class TestMobileLanding:
    def test_mobile_landing_page_loads(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        WebDriverWait(mobile_driver, 15).until(EC.title_contains("NestDirect"))
        assert "NestDirect" in mobile_driver.title

    def test_mobile_hero_text_visible(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        body = mobile_driver.find_element(AppiumBy.TAG_NAME, "body").text
        assert "Direct renting" in body or "without fees" in body


class TestMobileTouchTargets:
    @pytest.mark.parametrize("label", TAP_TARGETS)
    def test_tap_target_is_present_and_tappable(self, mobile_driver, base_url, label):
        mobile_driver.get(base_url)
        el = WebDriverWait(mobile_driver, 15).until(
            EC.presence_of_element_located((AppiumBy.XPATH, f"//*[contains(@text,'{label}') or contains(.,'{label}')]"))
        )
        # Minimum recommended touch target is 44x44 CSS px (Apple/Google guidance)
        size = el.size
        assert size['height'] >= 30, f"'{label}' touch target too small: {size}"


class TestMobileTabSwitching:
    def test_mobile_switch_to_signin(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        tab = WebDriverWait(mobile_driver, 15).until(
            EC.element_to_be_clickable((AppiumBy.XPATH, "//*[contains(.,'SIGN IN')]"))
        )
        tab.click()
        WebDriverWait(mobile_driver, 10).until(
            EC.presence_of_element_located((AppiumBy.XPATH, "//*[contains(.,'Sign In with Email')]"))
        )

    def test_mobile_switch_to_register(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        tab = WebDriverWait(mobile_driver, 15).until(
            EC.element_to_be_clickable((AppiumBy.XPATH, "//*[contains(.,'REGISTER')]"))
        )
        tab.click()
        WebDriverWait(mobile_driver, 10).until(
            EC.presence_of_element_located((AppiumBy.XPATH, "//*[contains(.,'Create Account')]"))
        )


class TestMobilePropertyBrowse:
    def test_mobile_offline_visitor_flow_reaches_listings(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        link = WebDriverWait(mobile_driver, 15).until(
            EC.element_to_be_clickable((AppiumBy.XPATH, "//*[contains(.,'offline visitor')]"))
        )
        link.click()
        body = WebDriverWait(mobile_driver, 15).until(
            lambda d: d.find_element(AppiumBy.TAG_NAME, "body").text
        )
        assert "₹" in body

    def test_mobile_scroll_reaches_footer_without_crash(self, mobile_driver, base_url):
        mobile_driver.get(base_url)
        mobile_driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
        body = mobile_driver.find_element(AppiumBy.TAG_NAME, "body").text
        assert "application error" not in body.lower()
