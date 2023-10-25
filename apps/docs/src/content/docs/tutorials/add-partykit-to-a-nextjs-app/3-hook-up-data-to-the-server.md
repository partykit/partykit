---
title: Hook up data to the server
sidebar:
    label: 3. Hook up data to the server
description: ...
---

INTRO
When the user submits the poll form, the Next.js app will send it to your PartyKit server.

## Connect the poll form

In this step you will work with the file, which generates the poll, `page.tsx`, in the `app` directory.

If you take a look at the file, you'll notice that there is already the code to get the data from the form in the server action:

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

:::tip[New id, new room]
Please note the randomly generated `id` in the code above. Every new `id` results in a new PartyKit room (or, PartyKit server) created, which means that every poll will be connected to its own room.
:::

To test if the code you wrote works, try creating a new poll in the browser. You should see a behavior similar to this one:

<!-- screen recording -->

As you see, the data is static so let's change that.

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

Time to validate that your poll page works. Go to the page and see if you are getting the data from the form on the new poll page:

<!-- screen recording -->

This page works but the votes are still not real-time. Let's change that.