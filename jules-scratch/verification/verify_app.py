from playwright.sync_api import sync_playwright, Page

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the homepage and take a screenshot
    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="jules-scratch/verification/homepage.png")
    print("Took homepage screenshot.")

    # Navigate to the Studio page and take a screenshot
    try:
        page.get_by_role("link", name="Go to Studio").click()
        page.wait_for_load_state("networkidle")
        page.screenshot(path="jules-scratch/verification/studio-page.png")
        print("Took studio page screenshot.")
    except Exception as e:
        print(f"Could not navigate to studio page: {e}")


    browser.close()

with sync_playwright() as playwright:
    run(playwright)