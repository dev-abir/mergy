# mergy

BiteSpeed Backend Developer assignment (https://wellfound.com/jobs/3018579-backend-developer-sde-1).

To respect the techstack preference, I have used Nest.js and postgres. Then, to cover all the edge cases (which I can think of) I have used [bruno](https://www.usebruno.com/). Bruno is kind-of an open-source alternative to Postman, with a dedicated language (bru) and VCS support. I actively use it, after having some bad expereinces with Postman.

I tried using supertest and jest (provided by nest.js), but I felt some inconsistencies (or maybe a skill issue on my side?). I just directly did an end-to-end test.

> Live at: http://13.201.78.251:100/docs \
> Swagger docs: http://localhost:3000/docs

## Run
- `npm i`
- Copy the `.env.sample` and rename it to `.env`. Then edit the variables accordingly.
- `npm run start`

## Tests
> **Note: TESTS DELETES ALL THE CONTACTS AT FIRST**
- Install bruno CLI: `npm install -g @usebruno/cli` (or you may just install locally: `npm i @usebruno/cli`)
- (Optional) install bruno GUI, import the collection and run using the GUI runner.
- (Optional) Inside the env folder, you may edit the dev.bru to like edit the port etc.
- `cd mergy-collection`
- `bru run --env dev`

## Notes for deployment
- Do a `chmod +x start.bash`