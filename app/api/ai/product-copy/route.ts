type ProductCopyRequest = {
  title?: string;
  price?: string;
  category?: string;
  description?: string;
  sellerSlug?: string;
};

type OpenAITextContent = {
  type?: string;
  text?: string;
};

type OpenAIResponseOutput = {
  type?: string;
  content?: OpenAITextContent[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIResponseOutput[];
};

const PRODUCT_COPY_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Título breve y vendedor para el producto.",
    },
    description: {
      type: "string",
      description: "Descripción pulida en español para la página del producto.",
    },
    whatsappMessage: {
      type: "string",
      description: "Mensaje corto listo para enviar por WhatsApp.",
    },
    socialCaption: {
      type: "string",
      description: "Caption breve para Facebook, Instagram o grupos locales.",
    },
    tags: {
      type: "array",
      description: "Etiquetas cortas en español.",
      items: {
        type: "string",
      },
    },
  },
  required: [
    "title",
    "description",
    "whatsappMessage",
    "socialCaption",
    "tags",
  ],
  additionalProperties: false,
};

function getOutputText(response: OpenAIResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function getCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 503 }
    );
  }

  let body: ProductCopyRequest;

  try {
    body = (await request.json()) as ProductCopyRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = getCleanString(body.title);
  const category = getCleanString(body.category);
  const description = getCleanString(body.description);
  const price = getCleanString(body.price);
  const sellerSlug = getCleanString(body.sellerSlug);

  if (!title && !description) {
    return Response.json(
      { error: "Add at least a product name or rough description." },
      { status: 400 }
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      store: false,
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "developer",
          content:
            "Eres el asistente de ventas de YoComproLocal, un proyecto local de Cuautitlán Izcalli. Escribe en español mexicano, cálido, claro y sin exagerar. Ayuda a personas con negocios pequeños a verse profesionales. No inventes certificaciones, descuentos, entregas, ingredientes o garantías que no estén en la información del usuario.",
        },
        {
          role: "user",
          content: [
            "Genera copy de venta para este producto local.",
            `Vendedor slug: ${sellerSlug || "no especificado"}`,
            `Producto: ${title || "no especificado"}`,
            `Precio: ${price || "no especificado"}`,
            `Categoría: ${category || "no especificada"}`,
            `Descripción inicial: ${description || "no especificada"}`,
            "El resultado debe ser útil para una página de producto, WhatsApp y redes sociales locales.",
          ].join("\n"),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "yocomprolocal_product_copy",
          strict: true,
          schema: PRODUCT_COPY_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI product copy error:", errorText);

    return Response.json(
      { error: "Could not generate product copy." },
      { status: 502 }
    );
  }

  const openAIResponse = (await response.json()) as OpenAIResponse;
  const outputText = getOutputText(openAIResponse);

  try {
    return Response.json(JSON.parse(outputText));
  } catch (error) {
    console.error("OpenAI product copy parse error:", error);

    return Response.json(
      { error: "Could not read generated product copy." },
      { status: 502 }
    );
  }
}
