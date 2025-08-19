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

    // --------------------------- logged in ----------------------------------

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

    const convos = await page.locator(
        `div[class="panel-body conversation_selected conversation_unread "]`
    );

    console.log(`Convo count: ${await convos.count()}`)

    if (await convos.count() === 0) {
        msgPageNum++;
        if(msgPageNum > msgPages +1) return console.log("Page finished");
        await page.goto(`https://www.wg-gesucht.de/nachrichten.html?page=${msgPageNum}`)
    }

    const convo = await convos.first();

    const convoId = (await convo.getAttribute("data-conversation_id"));

    await page.goto(`https://www.wg-gesucht.de/nachricht.html?nachrichten-id=${convoId}`)

    await page.locator(
        `textarea[id="message_input"]`
    ).fill(
        `
Thank you for your message. Interviews/Viewings will be conducted on sunday at 3pm.

I am the owner, the contract is for one year and can be prolonged after the year. Anmeldung is possible. The deposit is three cold rents. 

The address is Westendallee 88, alternatively a video tour after the showing can also be arranged.

Please confirm you have understood these conditions, and send me a message on whatsapp (+49 17672576806) to set up an appointment for sunday.
            `
    );

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
}

await main(process.env.WG_USER, process.env.WG_PASSWORD);
