declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
	interface Render {
		'.md': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	}
}

declare module 'astro:content' {
  export { z } from 'astro/zod';
  
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

  // This needs to be in sync with ImageMetadata
	export type ImageFunction = () => import('astro/zod').ZodObject<{
		src: import('astro/zod').ZodString;
		width: import('astro/zod').ZodNumber;
		height: import('astro/zod').ZodNumber;
		format: import('astro/zod').ZodUnion<
			[
				import('astro/zod').ZodLiteral<'png'>,
				import('astro/zod').ZodLiteral<'jpg'>,
				import('astro/zod').ZodLiteral<'jpeg'>,
				import('astro/zod').ZodLiteral<'tiff'>,
				import('astro/zod').ZodLiteral<'webp'>,
				import('astro/zod').ZodLiteral<'gif'>,
				import('astro/zod').ZodLiteral<'svg'>,
				import('astro/zod').ZodLiteral<'avif'>,
			]
		>;
	}>;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<[BaseSchemaWithoutEffects, ...BaseSchemaWithoutEffects[]]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<BaseSchemaWithoutEffects, BaseSchemaWithoutEffects>;

	type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	export type SchemaContext = { image: ImageFunction };

	type DataCollectionConfig<S extends BaseSchema> = {
		type: 'data';
		schema?: S | ((context: SchemaContext) => S);
	};

	type ContentCollectionConfig<S extends BaseSchema> = {
		type?: 'content';
		schema?: S | ((context: SchemaContext) => S);
	};

	type CollectionConfig<S> = ContentCollectionConfig<S> | DataCollectionConfig<S>;

	export function defineCollection<S extends BaseSchema>(
		input: CollectionConfig<S>
	): CollectionConfig<S>;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[]
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[]
	): Promise<CollectionEntry<C>[]>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"docs": {
"add-to-existing-project.md": {
	id: "add-to-existing-project.md";
  slug: "add-to-existing-project";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"enterprise.md": {
	id: "enterprise.md";
  slug: "enterprise";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/active-user-avatars.md": {
	id: "examples/app-examples/active-user-avatars.md";
  slug: "examples/app-examples/active-user-avatars";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/chat-app-with-ai-and-auth.md": {
	id: "examples/app-examples/chat-app-with-ai-and-auth.md";
  slug: "examples/app-examples/chat-app-with-ai-and-auth";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/connection-counter.md": {
	id: "examples/app-examples/connection-counter.md";
  slug: "examples/app-examples/connection-counter";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/cursors-with-country-flags.md": {
	id: "examples/app-examples/cursors-with-country-flags.md";
  slug: "examples/app-examples/cursors-with-country-flags";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/falling-sand-game-three-js.md": {
	id: "examples/app-examples/falling-sand-game-three-js.md";
  slug: "examples/app-examples/falling-sand-game-three-js";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/live-polls-app.md": {
	id: "examples/app-examples/live-polls-app.md";
  slug: "examples/app-examples/live-polls-app";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/live-polls-web-component.md": {
	id: "examples/app-examples/live-polls-web-component.md";
  slug: "examples/app-examples/live-polls-web-component";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/mosaic-realtime-game.md": {
	id: "examples/app-examples/mosaic-realtime-game.md";
  slug: "examples/app-examples/mosaic-realtime-game";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/multiplayer-ai-chat-rooms.md": {
	id: "examples/app-examples/multiplayer-ai-chat-rooms.md";
  slug: "examples/app-examples/multiplayer-ai-chat-rooms";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/multiplayer-text-editor.md": {
	id: "examples/app-examples/multiplayer-text-editor.md";
  slug: "examples/app-examples/multiplayer-text-editor";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/realtime-reaction-counter.md": {
	id: "examples/app-examples/realtime-reaction-counter.md";
  slug: "examples/app-examples/realtime-reaction-counter";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/the-namib-desert-watering-hole-livestream.md": {
	id: "examples/app-examples/the-namib-desert-watering-hole-livestream.md";
  slug: "examples/app-examples/the-namib-desert-watering-hole-livestream";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/two-way-hyperlinks-and-social-webpages.md": {
	id: "examples/app-examples/two-way-hyperlinks-and-social-webpages.md";
  slug: "examples/app-examples/two-way-hyperlinks-and-social-webpages";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/app-examples/youtube-watch-party.md": {
	id: "examples/app-examples/youtube-watch-party.md";
  slug: "examples/app-examples/youtube-watch-party";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/index.mdx": {
	id: "examples/index.mdx";
  slug: "examples";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"examples/starter-kits/game-starter-nextjs-redux.md": {
	id: "examples/starter-kits/game-starter-nextjs-redux.md";
  slug: "examples/starter-kits/game-starter-nextjs-redux";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/starter-kits/remix-starter.md": {
	id: "examples/starter-kits/remix-starter.md";
  slug: "examples/starter-kits/remix-starter";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/starter-kits/replicache-starter.md": {
	id: "examples/starter-kits/replicache-starter.md";
  slug: "examples/starter-kits/replicache-starter";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"examples/starter-kits/tinybase-starter.md": {
	id: "examples/starter-kits/tinybase-starter.md";
  slug: "examples/starter-kits/tinybase-starter";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"glossary.md": {
	id: "glossary.md";
  slug: "glossary";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/authentication.md": {
	id: "guides/authentication.md";
  slug: "guides/authentication";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/creating-custom-endpoints-with-onfetch.md": {
	id: "guides/creating-custom-endpoints-with-onfetch.md";
  slug: "guides/creating-custom-endpoints-with-onfetch";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/debugging.md": {
	id: "guides/debugging.md";
  slug: "guides/debugging";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/deploy-to-cloudflare.md": {
	id: "guides/deploy-to-cloudflare.md";
  slug: "guides/deploy-to-cloudflare";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/deploying-your-partykit-server.md": {
	id: "guides/deploying-your-partykit-server.md";
  slug: "guides/deploying-your-partykit-server";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/handling-binary-messages.md": {
	id: "guides/handling-binary-messages.md";
  slug: "guides/handling-binary-messages";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/index.md": {
	id: "guides/index.md";
  slug: "guides";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/integrating-partykit-into-a-react-app.md": {
	id: "guides/integrating-partykit-into-a-react-app.md";
  slug: "guides/integrating-partykit-into-a-react-app";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/integrating-partykit-with-deployment-platforms.md": {
	id: "guides/integrating-partykit-with-deployment-platforms.md";
  slug: "guides/integrating-partykit-with-deployment-platforms";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/managing-environment-variables.md": {
	id: "guides/managing-environment-variables.md";
  slug: "guides/managing-environment-variables";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/persisting-state-into-storage.md": {
	id: "guides/persisting-state-into-storage.md";
  slug: "guides/persisting-state-into-storage";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/preview-environments.md": {
	id: "guides/preview-environments.md";
  slug: "guides/preview-environments";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/rate-limiting-messages.md": {
	id: "guides/rate-limiting-messages.md";
  slug: "guides/rate-limiting-messages";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/responding-to-http-requests.md": {
	id: "guides/responding-to-http-requests.md";
  slug: "guides/responding-to-http-requests";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/scaling-partykit-servers-with-hibernation.mdx": {
	id: "guides/scaling-partykit-servers-with-hibernation.mdx";
  slug: "guides/scaling-partykit-servers-with-hibernation";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"guides/scheduling-tasks-with-alarms.md": {
	id: "guides/scheduling-tasks-with-alarms.md";
  slug: "guides/scheduling-tasks-with-alarms";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/serving-static-assets.md": {
	id: "guides/serving-static-assets.md";
  slug: "guides/serving-static-assets";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/setting-up-ci-cd-with-github-actions.md": {
	id: "guides/setting-up-ci-cd-with-github-actions.md";
  slug: "guides/setting-up-ci-cd-with-github-actions";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/using-multiple-parties-per-project.md": {
	id: "guides/using-multiple-parties-per-project.md";
  slug: "guides/using-multiple-parties-per-project";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"guides/validating-client-inputs.md": {
	id: "guides/validating-client-inputs.md";
  slug: "guides/validating-client-inputs";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"how-partykit-works.md": {
	id: "how-partykit-works.md";
  slug: "how-partykit-works";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"index.mdx": {
	id: "index.mdx";
  slug: "index";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".mdx"] };
"quickstart.md": {
	id: "quickstart.md";
  slug: "quickstart";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/index.md": {
	id: "reference/index.md";
  slug: "reference";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partykit-ai.md": {
	id: "reference/partykit-ai.md";
  slug: "reference/partykit-ai";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partykit-cli.md": {
	id: "reference/partykit-cli.md";
  slug: "reference/partykit-cli";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partykit-configuration.md": {
	id: "reference/partykit-configuration.md";
  slug: "reference/partykit-configuration";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partykitserver-legacy-api.md": {
	id: "reference/partykitserver-legacy-api.md";
  slug: "reference/partykitserver-legacy-api";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partyserver-api.md": {
	id: "reference/partyserver-api.md";
  slug: "reference/partyserver-api";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/partysocket-api.md": {
	id: "reference/partysocket-api.md";
  slug: "reference/partysocket-api";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"reference/y-partykit-api.md": {
	id: "reference/y-partykit-api.md";
  slug: "reference/y-partykit-api";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/2-adding-realtime-cursors.md": {
	id: "tutorials/2-adding-realtime-cursors.md";
  slug: "tutorials/2-adding-realtime-cursors";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/2-set-up-server.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/2-set-up-server.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/2-set-up-server";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/3-hook-up-data-to-the-server.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/3-hook-up-data-to-the-server.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/3-hook-up-data-to-the-server";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/4-add-websockets.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/4-add-websockets.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/4-add-websockets";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/5-broadcast-the-change.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/5-broadcast-the-change.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/5-broadcast-the-change";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/6-add-storage.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/6-add-storage.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/6-add-storage";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/7-deploy-your-app.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/7-deploy-your-app.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app/7-deploy-your-app";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/add-partykit-to-a-nextjs-app/index.md": {
	id: "tutorials/add-partykit-to-a-nextjs-app/index.md";
  slug: "tutorials/add-partykit-to-a-nextjs-app";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
"tutorials/index.md": {
	id: "tutorials/index.md";
  slug: "tutorials";
  body: string;
  collection: "docs";
  data: InferEntrySchema<"docs">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../src/content/config.js");
}
