export const escapeRegExp = (value: string): string => {
	return value.replace(/[.*+?^${}|()[\]\\]/g, '\\$&');
};

export const returnBookIds = async (model: {
	find: (query: Record<string, never>) => Promise<Array<{ bookId: string }>>;
}): Promise<string[]> => {
	const bookNames = await model.find({});
	return bookNames.map((book) => book.bookId);
};

export const compareAlphabetically = (left: string, right: string): number => {
	const normalizedLeft = left.toLowerCase();
	const normalizedRight = right.toLowerCase();
	return normalizedLeft < normalizedRight
		? -1
		: normalizedLeft > normalizedRight
			? 1
			: 0;
};
