import {chromium} from 'playwright';
import 'dotenv/config';

async function main(email, pw) {

    if (!process.env.WG_USER || process.env.WG_USER.length < 1 ||
        !process.env.WG_PASSWORD || process.env.WG_PASSWORD.length < 1)
        return console.error("Err: No User or Password given")

    const browser = await chromium.launch({headless: true});
    const context = await browser.newContext();
    const page = await context.newPage();


    await page.goto('https://www.wg-gesucht.de/');

    await page.locator(
        `span[id="cmpbntyestxt"]`
    ).click();

    await page.locator(
        `a[onclick="fireLoginOrRegisterModalRequest('sign_in');"]`
    ).click();

    await page.locator(
        `input[id="login_email_username"]`
    ).fill(email);


    await page.locator(
        `input[id="login_password"]`
    ).first().fill(pw);

    await page.locator(
        `input[id="login_submit"]`
    ).click();

    await page.waitForTimeout(2000);

    await page.goto('https://www.wg-gesucht.de/meine-anzeigen.html');

    await page.locator(
        `span[class="mdi mdi-dots-vertical mdi-20px pull-right cursor-pointer"]`
    ).first().click();

    await page.locator(
        `a`
    ).filter({hasText: "Bearbeiten + Fotos"}).first().click()


    const titleLocator = await page.locator(
        `input[id="ad_title"]`
    );

    const titleVal = await titleLocator.inputValue();

    await titleLocator.fill(
        titleVal[titleVal.length - 1] === "." ?
            titleVal.substring(0, titleVal.length - 1)
            :
            `${titleVal}.`
    );

    await page.locator(
        `button[id="update_offer"]`
    ).first().click();


    await page.waitForTimeout(5000);

    // Teardown
    await context.close();
    await browser.close();

    return 0;
}

await main(process.env.WG_USER, process.env.WG_PASSWORD);
