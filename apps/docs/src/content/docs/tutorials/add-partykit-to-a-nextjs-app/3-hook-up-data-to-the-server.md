---
title: Hook up data to the server
sidebar:
    label: 3. Hook up data to the server
description: In this step you will connect UI and the PartyKit server
---

In the previous step, you've set up the PartyKit server to handle messages. In this step you will connect it to the UI. When the user submits the poll form, the Next.js app will send it to your PartyKit server.

## Connect the poll form

Navigate to `page.tsx`, in the `app` directory, which generates the poll.

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
      options,
    };
```

So now you need to send it to PartyKit with an HTTP request to the server:

```ts
    await fetch(`${PARTYKIT_URL}/party/${id}`, {
      method: "POST",
      body: JSON.stringify(poll),
      headers: {
        "Content-Type": "application/json",
      },
    });
```

In the above code snippet, the `PARTYKIT_URL` variable is already defined in the app. Please remember to set this environment variable in your Next.js environment (for example, on Vercel).

:::tip[New id, new room]
Please note the randomly generated `id` in the code above. Every new `id` results in a new PartyKit room (or, PartyKit server) created, which means that every poll will be connected to its own room.
:::

To test if the code you wrote works, try creating a new poll in the browser. Your form creates a poll but there's a problem. The data is static so let's change that.

## Connect the poll page

Navigate to the file which renders the poll page, `page.tsx` in the `app/[poll_id]` directory.

In the previous step of this tutorial, your `onRequest` method returned the poll data. You can now use it to render the poll on the server:

```ts
  const req = await fetch(`${PARTYKIT_URL}/party/${pollId}`, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });
```

:::tip[Caching]
Notice the `revalidate: 0`. Next.js will cache server fetches by default. As the votes should be always up-to-date, you can disable caching. Your app will still be as performant as fast because PartyKit runs on the same edge network as Vercel.
:::

Finally, read the response from the server and replace the mock data:

```ts
  const poll = (await req.json()) as Poll;
```

Time to validate that your poll page works. Go to the page and see if you are the data you entered in the form renders now on the new poll page.

# Next steps

Congratulations! This page works so let's make it better. Let's make the votes [update in real time](./4-add-websockets).
