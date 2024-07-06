/**
 * Replace %placeholders% in a string with the values from a record
 * If placeholder starts with a $, it will be replaced by the value of its environment variable, or an empty string if not found
 * Otherwise, it will be replaced by the value of the key in the record, or an error will be thrown if not found
 * @param content
 * @param placeholders
 * @returns
 */
export function replacePlaceholders(
	content: string,
	placeholders?: Record<string, string>,
) {
	return content.replace(/%(\$?\w+)%/g, (_, key) => {
		if (key.startsWith("$")) {
			return process.env[key.slice(1)] ?? "";
		}
		if (placeholders && key in placeholders) {
			return placeholders[key];
		}
		throw new Error(`Placeholder ${key} not available`);
	});
}
