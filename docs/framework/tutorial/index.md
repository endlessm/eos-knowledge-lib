---
short-description: Step-by-step walkthrough of creating a content app using the Endless SDK
...
# Walkthrough #

Here's an example of how to use the Endless SDK to take online content and package it to be available offline in an app.

We'll do the whole thing in a few steps.
First, we'll write a program called an **ingester** that downloads the content and makes it suitable for offline viewing.
The ingester creates an archive called a **hatch**.
We'll use a tool called Hatch Previewer to examine the hatch and make visual improvements in the ingester.
Then we turn the hatch into another, more compressed archive called a **shard**, which is used to publish the content.
Next, we will build a user interface for the app, and test it together with the shard.
Finally, we will show how to put the user interface and one or more shards together into an app, which can be published as a [flatpak] package.

We're going to use the [blog of the Creative Commons organization][cc-blog] itself.
The blog and its content are licensed CC-BY 4.0, which means that it's free to use and modify as long as we credit the original author.

## Requirements for following this walkthrough ##

The walkthrough is written for Endless OS.
It can be done on other Linux computers, but in that case you might have to adapt the instructions for yourself a bit.

You should have some familiarity with using the terminal and common commands.

[cc-blog]: https://creativecommons.org/blog
[flatpak]: https://flatpak.org
