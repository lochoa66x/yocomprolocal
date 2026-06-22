# Supabase Auth Email Template

Use this guide when setting up the seller access email for YoComproLocal.

The goal is simple: when a seller asks for access, the email should feel like it
comes from YoComproLocal and should clearly open the private seller panel.

## Where To Configure It

In Supabase, open:

```text
Authentication > Emails > Templates > Magic Link or OTP
```

If the template editor is locked or the Source tab is grayed out, Supabase is
still using the default email system. That is okay for MVP login testing. The
app supports the default Supabase link format.

To fully control the sender, subject, and body, enable custom SMTP first:

```text
Authentication > Emails > SMTP Settings
```

## Sender

Short-term sender name:

```text
YoComproLocal
```

Future domain sender:

```text
acceso@yocomprolocal.com.mx
```

or:

```text
hola@yocomprolocal.com.mx
```

Before using a domain sender in production, configure SPF, DKIM, and DMARC for
`yocomprolocal.com.mx` with the email provider.

## Subject

Use:

```text
Tu acceso a YoComproLocal
```

## Friendly Email Copy

Use this wording for the email body:

```text
Hola,

Aquí está tu acceso seguro a YoComproLocal.

Toca el botón para abrir tu panel privado. Desde ahí puedes agregar productos,
editar tu tienda y compartir tus links por WhatsApp.

Si no pediste este acceso, puedes ignorar este correo.

El enlace vence pronto y solo se puede usar una vez.
```

## Recommended HTML Template

Use this after custom SMTP is enabled and Supabase allows editing the Source
template:

```html
<h2>Tu acceso a YoComproLocal</h2>

<p>Hola,</p>

<p>Aqui esta tu acceso seguro a YoComproLocal.</p>

<p>
  Toca el boton para abrir tu panel privado. Desde ahi puedes agregar productos,
  editar tu tienda y compartir tus links por WhatsApp.
</p>

<p>
  <a
    href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/panel"
    style="display:inline-block;padding:14px 22px;background:#24d366;color:#0f2d1f;text-decoration:none;border-radius:999px;font-weight:700;"
  >
    Abrir mi panel
  </a>
</p>

<p>Si no pediste este acceso, puedes ignorar este correo.</p>
<p>El enlace vence pronto y solo se puede usar una vez.</p>
```

Notes:

- Keep the button text as `Abrir mi panel`.
- Keep the destination on `/auth/callback`.
- Keep `next=/panel` so the seller lands in their dashboard.
- The app also supports the default Supabase magic link when this template is
  not editable yet.

## Production QA

After changing the email setup:

1. Open `https://yocomprolocal.com.mx/entrar`.
2. Request an access email with a seller email that exists in `public.sellers`.
3. Confirm the subject says `Tu acceso a YoComproLocal`.
4. Confirm the email mentions YoComproLocal and the seller panel.
5. Click the email button in the same browser.
6. Confirm the URL starts with `https://yocomprolocal.com.mx/auth/callback`.
7. Confirm the seller lands on `/panel/vendedor/[seller-slug]`.
8. Request a second link and confirm the expired or used-link message is easy to
   understand.

## Future Login Research

Email magic links are the MVP path. Later, investigate:

- SMS one-time codes.
- WhatsApp one-time codes.
- Phone recovery when a seller changes number.
- A fallback support process when a seller loses email or phone access.

Do not add SMS or WhatsApp OTP until the core seller upload flow has been tested
with real local sellers.
