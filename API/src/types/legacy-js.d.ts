declare module '*V1/DB/models/*' {
	const model: any;
	export default model;
}

declare module '*V2/Deploy/models/*' {
	const model: any;
	export default model;
}

declare module '*/api/graphql/resolvers/*' {
	export const resolvers: any;
	export const createContext: any;
}

declare module '*/api/graphql/schemas/*' {
	const typeDefs: any;
	export default typeDefs;
}

// Precise declarations for legacy model modules (V1 & V2)
// V1 models are migrated into `API/src/models` and exported as TypeScript modules.
declare module '*/src/models/bookName.js' {
	import type { Document, Model } from 'mongoose';
	const model: Model<any & Document>;
	export default model;
}

declare module '*/src/models/hadith.js' {
	import type { Document, Model } from 'mongoose';
	const model: Model<any & Document>;
	export default model;
}

// V2 models are migrated into `API/src/models` and exported as TypeScript modules.
declare module '*/src/models/bookNameV2.js' {
	import type { Document, Model } from 'mongoose';
	const model: Model<any & Document>;
	export default model;
}

declare module '*/src/models/hadithV2.js' {
	import type { Document, Model } from 'mongoose';
	const model: Model<any & Document>;
	export default model;
}

declare module '*/src/models/ingredientsV2.js' {
	import type { Document, Model } from 'mongoose';
	const model: Model<any & Document>;
	export default model;
}

// GraphQL JS entrypoints (some loaders still import .js specifiers)
declare module '*/api/graphql/resolvers/index.js' {
	export const resolvers: any;
	export const createContext: any;
}

declare module '*/api/graphql/schemas/index.js' {
	const typeDefs: any;
	export default typeDefs;
}
