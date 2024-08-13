export const display5Tickets = (tickets) => {
  for (let i = 0; i < 5; i++) {
    console.log(`Ticket ${i}:`);
    console.log(`  Title: ${tickets[i].title}`);
    console.log(`  URL: ${tickets[i].link}`);
    console.log("---\n");
  }
};

export const displayAllTickets = (tickets) => {
  tickets.forEach((ticket, index) => {
    console.log(`Ticket ${index + 1}:`);
    console.log(`  Title: ${ticket.title}`);
    console.log(`  URL: ${ticket.link}`);
    console.log("---\n");
  });
};

export async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
