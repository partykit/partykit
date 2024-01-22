import * as React from "react";
import chalk from "chalk";
import { render, Text } from "ink";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function CountingDown({ seconds, text }: { seconds: number; text: string }) {
  return (
    <Text>
      {text}: {chalk.bold(seconds)}
    </Text>
  );
}

export default async function countdown(text: string, seconds: number) {
  const { unmount, rerender } = render(
    <CountingDown seconds={seconds} text={text} />
  );
  for (let i = seconds; i > 0; i--) {
    rerender(<CountingDown seconds={i} text={text} />);
    await sleep(1000);
  }
  unmount();
}
