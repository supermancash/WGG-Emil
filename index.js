import chromium from '@sparticuz/chromium-min';
import {chromium as playwright} from "playwright-core";

import {chromium as devChromium} from "playwright";

import 'dotenv/config';

async function main(email, pw) {

    if (!email || email.length < 1 ||
        !pw || pw.length < 1)
        return console.error("Err: No User or Password given")

    const browser = process.env.NODE_ENV === "development" ?
        await devChromium.launch({headless: false}) :
        await playwright.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(
                `https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar`
            ),
            headless: true,
        });



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


    await page.goto('https://www.wg-gesucht.de/nachrichten.html?page=1');

    const msgPages = await page.locator(
        `a[class="page-link"]`
    ).count();

    console.log(`PAGES: ${JSON.stringify(msgPages)}`);

    let msgPageNum = 1;

     await sendMessage(page, msgPageNum, msgPages)


    await page.waitForTimeout(5000);

    // Teardown
    await context.close();
    await browser.close();

    return 0;
}

async function sendMessage(page, msgPageNum, msgPages) {
    return new Promise(async (resolve, reject) => {

        await page.goto(`https://www.wg-gesucht.de/nachrichten.html?page=${msgPageNum}`)

        const convos = await page.locator(
            `div[class="panel-body conversation_selected conversation_unread "]`
        );

        console.log(`Convo count: ${await convos.count()}`)

        if (await convos.count() === 0) {
            if (msgPageNum >= msgPages) {
                console.log("Pages finished");
                return resolve();
            }
            await sendMessage(page, msgPageNum + 1, msgPages)
            return resolve();
        }

        const convo = await convos.first();

        const convoId = (await convo.getAttribute("data-conversation_id"));

        await page.goto(`https://www.wg-gesucht.de/nachricht.html?nachrichten-id=${convoId}`)

        await page.locator(
            `button[id="conversation_controls_dropdown"]`
        ).click();

        await page.locator(
            `a[data-toggle="modal"]`
        ).filter({hasText: 'Nachrichtenvorlagen'}).click();

        await page.locator(
            `label[class="message_template_label"]`
        ).filter({hasText: 'auto'}).click();


        await page.locator(
            `button[class="btn btn-block wgg_orange no-capitalize conversation_send_button send_messages"]`
        ).click();

        try {
            await page.goto(`https://www.wg-gesucht.de/nachrichten.html?page=${msgPageNum}`);
        } catch (e) {
            console.error(e);
            await page.waitForTimeout(5000);
            await page.goto("https://google.de");
            await page.goto(`https://www.wg-gesucht.de/nachrichten.html?page=${msgPageNum}`);
        }


        await sendMessage(page, msgPageNum, msgPages);
        return resolve();
    })
}

await main(process.env.WG_USER_JO, process.env.WG_PASSWORD_JO);
