import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:5173/studio", wait_until="load")

        # Add an extra wait for the application to fully render
        await page.wait_for_timeout(2000)

        # Click the "Show Fluid" button
        await page.get_by_role("button", name="Show Fluid").click()

        # Wait for the canvas to be visible
        await page.wait_for_selector("canvas")

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
