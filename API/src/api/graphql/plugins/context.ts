import type { GraphQLResolverContext } from '../contracts.js';

export const contextPlugin = {
	async requestDidStart() {
		return {
			async didResolveOperation({
				contextValue,
			}: {
				contextValue: GraphQLResolverContext;
			}) {
				void contextValue;
			},
		};
	},
};

export default contextPlugin;
