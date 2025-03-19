We're building Hyphenbox - a second cursor that guides users in-product. This repository is for the frontend dashboard of the product. The screens are located in /src/app. The required functionality is described as follows-

1. A cursor flow is available in a JSON format. 
2. Our client SDK is capable of reading a cursorflow JSON file and spawning a second cursor on-screen to guide users in-product (remember, this repository is is NOT the SDK, it's the admin dashboard to preview and edit these cursorflow JSON files)
3. These are the prposed features of hyphenbox-dashboard
    - Cursor flows screen: 
        - Shows a list of cursor flows. In this table, we also show the Audience it belongs to and the Status (Live/Draft)
        - There's a "Create flow" button that allows users to upload JSONs and process the steps
        - When a JSON is uploaded, we need to process it and show a preview of the flow using the preview template available in "src/app/dashboard/cursorflows/preview"
    - Cursor flow preview screen (in "src/app/dashboard/cursorflows/preview") :
        - Here the user can see every step in the flow and edit the text that appears next to the cursor.
        - They can remove a step if needed
        - Can restore removed steps
        - Once they are good with the flow, they hit publish and the flow is live
        - Once a flow is live, user has an option to "Rollback" the flow which puts it in the draft state again.
        - User has to click on the edit button to go to the edit state. all edits are stored continuously

    - Knowledge (in "src/app/dashboard/knowledge")
        - User can upload PDF, Markdown, TXT or any resource that has context about their product
        - They can also add links to their existing product docs or knowledge bases

    - Audiences ("src/app/dashboard/audiences"):
        - Users can create audiences. An audience can have multiple cursor flows associated with it
        - A cursor flow can only belong to one audience
        - In the audiences page, when a user clicks on one of the audiences they should be shown the list of cursor flows belonging to that audience in a list similar to the Cursor flows screen
        - Here, they'll only be able to preview and remove the flow from the given audience, not edit it.

    - Manage Team ("src/app/dashboard/team"):
        - Users should be able to invite other people
        - For now all invited users have the admin role
        - A magic link is sent to the invited user to help them login using supabase.
        - Collect their name and title while their onboarding.

    - Setup ("src/app/dashboard/developers"):
        - Static page showing instructions on how to setup ur frontend SDK 
        - Text and some copyable code snippets in the page