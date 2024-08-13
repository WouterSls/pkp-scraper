import { configs, configs_2 } from "./constants.js";
import {
  display5Tickets,
  displayAllTickets,
  sleep,
} from "./helperFunctions.js";
import puppeteer from "puppeteer";

async function convertButtonsToLinks(page) {
  try {
    const links = await page.$$eval(".button.-full.-arrow.-sp", (buttons) =>
      buttons.map((button) => ({
        title: button.textContent.trim(),
        link: button.href,
      }))
    );
    return links;
  } catch (error) {
    console.log("no buttons found returning empty array");
    return [];
  }
}

async function fillForm(page, config) {
  await page.type("#firstname", `${config.name}`);
  await page.type("#lastname", `${config.lastname}`);
  await page.type("#email", `${config.email}`);
  await page.type("#code", `${config.code}`);

  const checkbox = await page.$("#confirm");
  const isChecked = await page.evaluate((el) => el.checked, checkbox);

  if (!isChecked) {
    await page.evaluate((el) => el.click(), checkbox);
  } else {
    throw new Error("error checking checkbox");
  }
}

/**
async function submitForm2(page) {
  try {
    console.log("clicking confirm button");

    await page.click("#btnNext");
    console.log("waiting on navigation response");
  } catch (error) {
    console.error("Error submitting form:", error);
    const errorMessages = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll(".form__message"));
      return errors.map((e) => e.textContent.trim()).filter((e) => e !== "");
    });
    if (errorMessages.length > 0) {
      console.log("Form submission errors:", errorMessages);
    }
    throw new Error(error);
  }
}
 */

async function submitForm(page) {
  try {
    await page.focus("#btnNext");
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    await sleep(5000);
    console.log("Form submitted successfully");
    const currentUrl = await page.url();
    console.log("Current page URL after submission attempt:", currentUrl);
  } catch (error) {
    console.error("Error submitting form:", error.message);

    if (error.name === "TimeoutError") {
      console.log("Navigation timeout occurred. Checking page state...");

      // Check if the form is still present
      const formPresent = await page.$("form.wide");
      if (formPresent) {
        console.log("Form is still present. Submission might have failed.");
      } else {
        console.log(
          "Form is no longer present. Submission might have succeeded despite the timeout."
        );
      }

      // Check for any error messages on the page
      const errorMessages = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll(".form__message"));
        return errors.map((e) => e.textContent.trim()).filter((e) => e !== "");
      });

      if (errorMessages.length > 0) {
        console.log("Form submission errors:", errorMessages);
      } else {
        console.log("No error messages found on the page.");
      }
    }
  }
}

// sunday no chill
// "https://tickets.pukkelpop.be/nl/meetup/demand/day3/n/";
// sunday chill
// "https://tickets.pukkelpop.be/nl/meetup/demand/day3/a/";
// friday chill
// https://tickets.pukkelpop.be/nl/meetup/demand/day1/a/
// combi chill
// https://tickets.pukkelpop.be/nl/meetup/demand/combi/a/
// saturday no chill
// https://tickets.pukkelpop.be/nl/meetup/demand/day2/n/
const ticketToSearch = {
  name: "saturday no chill",
  link: "https://tickets.pukkelpop.be/nl/meetup/demand/day2/n/",
};

async function checkTicketAvailability() {
  console.log("-----------------PKP SCRAPER v1-----------------");
  console.log(`searching for ticket: ${ticketToSearch.name}`);
  console.log("\n");
  console.log("setting up browser...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    console.log(`going to page: ${ticketToSearch.link}`);

    await page.goto(ticketToSearch.link);
    let ticketFound = false;
    let attemptCount = 0;

    console.log("searching for available tickets...");

    while (!ticketFound) {
      attemptCount++;
      process.stdout.write(`\rAttempt ${attemptCount}`);
      try {
        await page.waitForSelector(".button.-full.-arrow.-sp", {
          timeout: 300,
        });
        ticketFound = true;
      } catch (error) {
        await page.reload({ waitUntil: "networkidle0" });
      }
      await sleep(5000);
    }

    const tickets = await convertButtonsToLinks(page);

    if (tickets.length > 0) {
      displayAllTickets(tickets);

      //First ticket
      const selectedTicketIndex = 0;

      console.log(`Selecting ticket: ${selectedTicketIndex + 1}`);
      const selectedTicket = tickets[selectedTicketIndex];
      console.log(`${selectedTicket.title}`);

      for (const config of configs) {
        console.log(`Filling form for config: ${config.email}`);

        try {
          await page.goto(selectedTicket.link, { waitUntil: "networkidle0" });
          await page.waitForSelector("form.wide", { timeout: 5000 });

          await fillForm(page, config);
          console.log("Form filled, attempting to submit...");
          await submitForm(page, config);
          console.log(
            `Form submitted for config: ${config.email} successfully\n\n`
          );

          const randomSleepAmount = Math.floor(Math.random() * 3000);
          console.log(
            `Waiting for ${randomSleepAmount}ms before next submission...`
          );
          await sleep(randomSleepAmount);
        } catch (error) {
          console.error(`Error processing config ${config.email}:`, error);
        }

        // Clear page to free up memory
        await page.evaluate(() => (document.body.innerHTML = ""));
      }
    } else {
      console.log("error converting buttons to links");
      console.log("exiting...");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }
}

checkTicketAvailability();
