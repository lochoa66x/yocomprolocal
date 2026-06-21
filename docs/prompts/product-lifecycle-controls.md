# Product Lifecycle Controls Prompt

Add practical product lifecycle controls to the protected YoComproLocal seller
panel.

The goal is to let sellers manage product visibility after publishing, without
needing database access or technical help.

Implement:

- A quick dashboard action to move a published product back to draft.
- A quick dashboard action to publish a draft product.
- Clear dashboard success messages for:
  - product published;
  - product moved to draft;
  - product deleted;
  - product action error.
- A deliberate delete flow on the product edit page.
- Delete confirmation that requires the seller to explicitly acknowledge the
  action.
- Server-side authorization using the existing seller access helper.

Keep the MVP boundaries tight:

- No admin approval.
- No inventory management.
- No archive table.
- No undo flow.
- No buyer accounts.
- No schema changes.

Acceptance test:

1. Visit `/panel/vendedor/[slug]` while logged in as the seller.
2. Move a published product to draft.
3. Confirm the dashboard shows a draft success message.
4. Confirm the product no longer has a public product CTA.
5. Publish the draft product again.
6. Confirm the dashboard shows a published success message.
7. Open the product edit page.
8. Try deleting without confirmation and confirm an error appears.
9. Confirm deletion with the checkbox.
10. Confirm the dashboard redirects with `?producto=eliminado`.
11. Confirm TypeScript passes.
