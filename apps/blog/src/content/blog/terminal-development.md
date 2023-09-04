---
title: How Do I Develop My Terminal Portfolio Website with React
author: Sat Naing
pubDatetime: 2022-06-09T03:42:51Z
postSlug: how-do-i-develop-my-terminal-portfolio-website-with-react
featured: false
draft: false
tags:
  - JavaScript
  - ReactJS
  - ContextAPI
  - Styled-Components
  - TypeScript
description:
  "EXAMPLE POST: Developing a terminal-like website using ReactJS, TypeScript and Styled-Components.
  Includes features like autocomplete, multiple themes, command hints etc."
---

> This article is originally from my [blog post](https://satnaing.dev/blog/posts/how-do-i-develop-my-terminal-portfolio-website-with-react). I put this article to demonstrate how you can write blog posts/articles using AstroPaper theme.

Developing a terminal-like website using ReactJS, TypeScript and Styled-Components. Includes features like autocomplete, multiple themes, command hints etc.

![Sat Naing's Terminal Portfolio](https://satnaing.dev/_ipx/w_2048,q_75/https%3A%2F%2Fres.cloudinary.com%2Fnoezectz%2Fimage%2Fupload%2Fv1654754125%2FSatNaing%2Fterminal-screenshot_gu3kkc.png?url=https%3A%2F%2Fres.cloudinary.com%2Fnoezectz%2Fimage%2Fupload%2Fv1654754125%2FSatNaing%2Fterminal-screenshot_gu3kkc.png&w=2048&q=75)

## Table of contents

## Intro

Recently, I've developed and published my portfolio + a blog. I’m glad I got some good feedback for it. Today, I want to introduce my new terminal-like portfolio website. It is developed using ReactJS, TypeScript. I got this idea from CodePen and YouTube.

## Tech Stack

This project is a frontend project without any backend codes. The UI/UX part is designed in Figma. For the frontend user-interface, I chose React over pain JavaScript and NextJS. Why?

- Firstly, I want to write declarative code. Managing HTML DOM using JavaScript imperatively is really tedious.
- Secondly, because it is React!!! It is fast, and reliable.
- Lastly, I don’t need much of the SEO features, routing and image optimization provided by NextJS.

And of course there's TypeScript for type checking.

For styling, I took a different approach than what I usually do. Instead of choosing Pure CSS, Sass, or Utility CSS Framework like TailwindCSS, I chose the CSS-in-JS way (Styled-Components). Although I’ve known about Styled-Components for some time, I’ve never tried it out. So, the writing style and structures of Styled-Components in this project may not be very organized or very good.

This project doesn’t need very complex state management. I just use ContextAPI in this project for multiple theming and to avoid prop drilling.

Here’s a quick recap for the tech stack.

- Frontend: [ReactJS](https://reactjs.org/ "React Website"), [TypeScript](https://www.typescriptlang.org/ "TypeScript Website")
- Styling: [Styled-Components](https://styled-components.com/ "Styled-Components Website")
- UI/UX: [Figma](https://figma.com/ "Figma Website")
- State Management: [ContextAPI](https://reactjs.org/docs/context.html "React ContextAPI")
- Deployment: [Netlify](https://www.netlify.com/ "Netlify Website")

## Features

Here are some features of the project.

### Multiple Themes

Users can change multiple themes. At the time of writing this post, there are 5 themes; and more themes will probably be added in the future. The selected theme is saved in local storage so that the theme won’t change on page refresh.

![Setting different theme](https://i.ibb.co/fSTCnWB/terminal-portfolio-multiple-themes.gif)

### Command-line Completion

To look and feel as close to the actual terminal as possible, I put a command-line completion feature which auto fills in partially typed commands by simply pressing ‘Tab’ or ‘Ctrl + i’.

![Demonstrating command-line completion](https://i.ibb.co/CQTGGLF/terminal-autocomplete.gif)

### Previous Commands

Users can go back to the previous commands or navigate the previously typed commands by pressing Up & Down Arrows.

![Going back to previous commands with UP Arrow](https://i.ibb.co/vD1pSRv/terminal-up-down.gif)

### View/Clear Command History

previously typed commands can be viewed by typing ‘history’ in the command line. All the command history and terminal screen can be wiped out by typing ‘clear’ or pressing ‘Ctrl + l’.

![Clearing the terminal with 'clear' or 'Ctrl + L' command](https://i.ibb.co/SJBy8Rr/terminal-clear.gif)

## Outro

This is a really fun project, and one special part of this project is I had to focus on logic rather than user-interface (even though this is kind of a frontend project).

## Project Links

- Website: [https://terminal.satnaing.dev/](https://terminal.satnaing.dev/ "https://terminal.satnaing.dev/")
- Repo: [https://github.com/satnaing/terminal-portfolio](https://github.com/satnaing/terminal-portfolio "https://github.com/satnaing/terminal-portfolio")
