---
title: Hook up data to the server
sidebar:
  label: 3. Hook up data to the server
description: In this step you will connect UI and the PartyKit server
---

In the previous step, you've set up the PartyKit server to handle messages. In this step, you will connect it to the UI. When the user submits the poll form, the Next.js app will send it to your PartyKit server.

## Connect the poll form

Navigate to `page.tsx`, in the `app` directory, which generates the poll (see online in <a href="https://github.com/partykit/tutorial-starter-partypoll/blob/main/app/page.tsx#L30" target="_blank" rel="noopener noreferrer">the starter</a> or <a href="https://github.com/partykit/partypoll/blob/main/app/page.tsx#L30-L36" target="_blank" rel="noopener noreferrer">the finished code</a>).

Take a look at the file. You'll notice that we've already included the code to get the data from the form in the server action:

```ts
const title = formData.get("title")?.toString() ?? "Anonymous poll";
const options: string[] = [];

for (const [key, value] of formData.entries()) {
  if (key.startsWith("option-") && value.length > 0) {
    options.push(value.toString());
  }
}

const id = randomId();
const poll: Poll = {
  title,
  options
};
```

Now you need to send it to PartyKit with an HTTP request to the server:

```ts
await fetch(`${PARTYKIT_URL}/party/${id}`, {
  method: "POST",
  body: JSON.stringify(poll),
  headers: {
    "Content-Type": "application/json"
  }
});
```

In the example project, we've already defined the `PARTYKIT_URL` variable and set it to the default PartyKit development server address. In the final step of this tutorial, you'll deploy your project to PartyKit and set this variable's value to your project's address.

:::tip[New id, new room]
Please note the randomly generated `id` in the code above. Every new `id` results in a new PartyKit room (PartyKit server) created, which means that every poll will be connected to its own room.
:::

To test if the code you wrote works, try creating a new poll in the browser. Your form creates a poll but there's a problem: the data is static. Let's change that.

## Connect the poll page

Navigate to the file which renders the poll page: `page.tsx` in the `app/[poll_id]` directory (see online in <a href="https://github.com/partykit/tutorial-starter-partypoll/blob/main/app/%5Bpoll_id%5D/page.tsx#L14-L16" target="_blank" rel="noopener noreferrer">the starter</a> or <a href="https://github.com/partykit/partypoll/blob/main/app/%5Bpoll_id%5D/page.tsx#L15C11-L30" target="_blank" rel="noopener noreferrer">the finished code</a>).

In the previous step of this tutorial, your `onRequest` method returned the poll data. You can now use it to render the poll on the server:

```ts
const req = await fetch(`${PARTYKIT_URL}/party/${pollId}`, {
  method: "GET",
  next: {
    revalidate: 0
  }
});

if (!req.ok) {
  if (req.status === 404) {
    notFound();
  } else {
    throw new Error("Something went wrong.");
  }
}
```

:::tip[Caching]
Notice the `revalidate: 0`. Next.js will cache server fetches by default. The votes should be always up-to-date so you can disable caching. Your app will still be performant and fast because PartyKit runs on the same edge network as Vercel.
:::

Finally, read the response from the server and replace the mock data:

```ts
const poll = (await req.json()) as Poll;
```

Time to validate that your poll page works. Go to the page and see if the data you entered in the form renders now on the new poll page.

# Next steps

Congratulations! This page works so let's make it better. Let's make the votes [update in real time](/tutorials/add-partykit-to-a-nextjs-app/4-add-websockets).

🎈 If you'd like to check how your code compares to the finished app, check the finished code (<a href="https://github.com/partykit/partypoll/blob/main/app/page.tsx#L30-L36" target="_blank" rel="noopener noreferrer"><code>app/page.tsx</code></a> and <a href="https://github.com/partykit/partypoll/blob/main/app/%5Bpoll_id%5D/page.tsx#L15C11-L30" target="_blank" rel="noopener noreferrer"><code>app/[poll_id]/page.tsx</code></a>) online 🎈
