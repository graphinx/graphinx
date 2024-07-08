import chalk from 'chalk';

export function transformStrings<T>(
	obj: T,
	transformer: (v: string) => string,
): T {
	if (typeof obj === 'string') {
		return transformer(obj) as unknown as T;
	}

	if (typeof obj !== 'object' || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((v) => transformStrings(v, transformer)) as unknown as T;
	}

	if (typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key,
				transformStrings(value, transformer),
			]),
		) as unknown as T;
	}

	return obj;
}

export function nonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null;
}

export async function asyncFilter<T>(
	input: T[],
	condition: (t: T) => Promise<boolean>,
): Promise<T[]> {
	const output: T[] = [];
	const results = await Promise.allSettled(input.map(condition));
	for (const [i, result] of results.entries()) {
		if (result.status === 'rejected') {
			throw result.reason;
		}

		if (result.value) {
			output.push(input[i]);
		}
	}
	return output;
}

export function shuffle<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export const b = (s: NonNullable<unknown>) => chalk.bold(s.toString());

export async function runThenLog<T>(
	promise: Promise<T>,
	message: string,
): Promise<T> {
	const r = await promise;
	console.info(message);
	return r;
}
