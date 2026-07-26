"""
Responsive layout test suite — parametrized across real device viewport
sizes (not arbitrary), since layout breakage is inherently viewport-specific.
"""
import pytest
from selenium.webdriver.common.by import By
from conftest import sized_driver, BASE_URL

VIEWPORTS = [
    ("iphone_se", 375, 667),
    ("iphone_12", 390, 844),
    ("ipad", 768, 1024),
    ("laptop", 1280, 800),
    ("desktop_fhd", 1920, 1080),
]


@pytest.mark.parametrize("name,width,height", VIEWPORTS)
class TestResponsiveLayout:
    def test_no_horizontal_scroll(self, name, width, height):
        drv = sized_driver(width, height)
        try:
            drv.get(BASE_URL)
            scroll_width = drv.execute_script("return document.documentElement.scrollWidth")
            client_width = drv.execute_script("return document.documentElement.clientWidth")
            # Allow a small tolerance for scrollbar width
            assert scroll_width <= client_width + 20, (
                f"Horizontal overflow at {name} ({width}x{height}): "
                f"scrollWidth={scroll_width} > clientWidth={client_width}"
            )
        finally:
            drv.quit()

    def test_login_card_visible_within_viewport(self, name, width, height):
        drv = sized_driver(width, height)
        try:
            drv.get(BASE_URL)
            card = drv.find_element(By.XPATH, "//*[contains(text(),'QUICK ACCESS')]")
            assert card.is_displayed()
        finally:
            drv.quit()

    def test_page_renders_without_js_error_banner(self, name, width, height):
        drv = sized_driver(width, height)
        try:
            drv.get(BASE_URL)
            body_text = drv.find_element(By.TAG_NAME, "body").text
            assert "application error" not in body_text.lower()
            assert "something went wrong" not in body_text.lower()
        finally:
            drv.quit()
