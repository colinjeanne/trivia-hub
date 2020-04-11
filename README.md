# Trivia Hub

Trivia Hub is a simple recreation of HQ Trivia. I'm basing the overall gameplay off of [this video](https://www.youtube.com/watch?v=in-Px_sOQdE) with some significant reductions in scope and some tweaks to play to account for those changes.

# Gameplay

## Trivia Round

A trivia round has poses an ordered set of multiple-choice questions to some number of users one at a time. User must answer the question correctly within a limited amount of time otherwise they can only spectate the rest of the round. All users that haven't been eliminated after the last question are the winners of the round.

## Game Lobby

Users have two options to play. User can either choose to play in a global game that starts whenever a sufficient number of players are present or they may choose to play with friends by creating and starting their own private round. Private rounds can be joined using a private code that is shared outside of Trivia Hub.

# Design

This project separates the frontend from the backend. This separation makes sense for several reasons including

- Static frontend assests can be distributed by CDNs making the page feel more responsive to users
- Frontends and backends have very different concerns and behaviors. Backends can often think about each request separately from every other requests while frontends need to keep track of and manage long-running state across many requests
- Frontends and backends are often built with very different technologies
- Frontends and backends are often maintained by different engineers

## Frontend Design

For this project I'm choosing to focus more of my effort on the backend and so the frontend is fairly skeletal. I'm choosing to deploy the frontend with GitHub pages because I've never used GitHub pages and would like to learn about it and because it looks like a quick way to get a frontend up and running. In a more fleshed out project this frontend could be pushed to S3 and rely on CloudFront to serve the assets to users.

### Game Lobby

### Trivia Round

## Backend Design

In the interests of time I've chosen to deploy the backend with Heroku because its API is quick and easy to use and because it appears to support the features I'll need for a prototype.

### Game Lobby

### Trivia Round

# Design Process

To start this task I first tried to understand what HQ Trivia was. The [Wikipedia](<https://en.wikipedia.org/wiki/HQ_(game)>) page wasn't as descriptive as I had hoped and so I looked up gameplay on YouTube [and was not disappointed](https://www.youtube.com/watch?v=in-Px_sOQdE).

Stripping out the flash of the application it appears that there are a few fundamental pieces

- A game lobby where users wait for the next game to begin
- A series of questions given to the users one at a time
- A countdown for the user to choose the correct answer
- A statistics screen shown for some period of time after the countdown expires showing how many users answered each question
- A small HUD showing a number of users (it's not clear from the video what the count is but I suspect is the number of users watching or participating)

The data this application needs for a single round is

- The current number of participating users some of which are still in the game and some of which are spectators
- An ordered set of multiple choice questions and answers
- The answer selections for each non-spectating user for the current question
- The current time left to answer the current question

Persistent user information isn't necessary to get this application started. All users need is a name and some way of participating in a game.

Similarly, games don't require persistent information since once they are over there's no way to access any of its information.

The countdown is one of the more interesting aspects of the game because it's short and realtime. We need all users and the service to agree on the current value of the countdown and so this seems like a good use for websockets. I've never used websockets before and my initial concern is that it would be difficult to scale an application to support many users since my mental model is that each user has a direct connection with a specific machine on the backend. How do we stop a large number of users from overwhelming a single machine?

To start, I googled. I came across [a page by StackOverflow](https://stackoverflow.blog/2019/12/18/websockets-for-fun-and-profit/) which gave me an overview and made me more confident that they were a good fit for the problem and [a page on Hackernoon](https://hackernoon.com/scaling-websockets-9a31497af051) about scaling websocket applications. I also remembered [this Reddit blog post](https://redditblog.com/2017/04/13/how-we-built-rplace/) an April Fool's game that had tens of thousands of users connected using websockets. It didn't offer too much new information but it did confirm that they were pairing websockets with a pub/sub service as the Hackernoon article suggested.

From here I had a skeleton of an idea

1. Each round is represented by a single websocket connection
2. Each round has a unique ID that is the websocket channel name as well as the channel name for the pub/sub service
3. If a user creates a game for friends they choose this ID
4. If a user chooses to join the global game they will request an ID from the service
5. At the point the user joins a game they choose a name and are given a unique ID from the service. The thinking here is that users might choose their first names when playing with friends and I don't want people to have to give up their name if they have friends with the same name.
6. When the round starts all users are marked as active and the service passes down a question and a timer
7. Every second the service synchronizes the time with the clients by passing down the remaining time
8. At any point within this window a user can submit an answer and it is stored in a dictionary of answers to users. Answers from spectators are ignored.
9. At the end of the timer the service sends the aggregate answer data and whether the user answered correctly or not
10. After some time the service sends the next question
11. After the last question the aggregate data includes a list of winners

From here there are a few things to work out

- How will time synchronization actually work? How long will websocket responses take to get to the client and so how much drift can I expect?
- How will I implement two services on the backend in a relatively short amount of time to get the pub/sub behavior?
