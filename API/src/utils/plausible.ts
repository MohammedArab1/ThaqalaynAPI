import axios from 'axios';
import type { NextFunction, Request, Response } from 'express';
import config from '../config/index.js';

type PlausibleEventPayload = {
	name: string;
	domain: string;
	url: string;
	props?: Record<string, string | number | boolean | null | undefined>;
};

const plausibleClient = axios.create({
	timeout: 1500,
});

const getVisitorIp = (request: Request): string | undefined => {
	const forwardedFor = request.headers['x-forwarded-for'];

	if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
		return forwardedFor.split(',')[0]?.trim();
	}

	if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
		return forwardedFor[0]?.split(',')[0]?.trim();
	}

	return request.ip || request.socket.remoteAddress || undefined;
};

const buildRequestUrl = (request: Request): string => {
	const protocol =
		request.headers['x-forwarded-proto']?.toString().split(',')[0]?.trim() ||
		request.protocol ||
		'http';
	const host = request.get('host') || 'localhost';
	return `${protocol}://${host}${request.originalUrl}`;
};

const sendPlausibleEvent = async (request: Request, response: Response) => {
	if (!config.app.plausibleApiUrl || !config.app.plausibleDomain) {
        return;
	}

	const payload: PlausibleEventPayload = {
		name: 'api_request',
		domain: config.app.plausibleDomain,
		url: buildRequestUrl(request),
		props: {
			method: request.method,
			path: request.originalUrl,
			status: response.statusCode,
		},
	};

	const headers = {
		'Content-Type': 'application/json',
		'User-Agent': request.get('user-agent') || '',
		'X-Forwarded-For': getVisitorIp(request) || '',
	};
	await plausibleClient.post(config.app.plausibleApiUrl, payload, { headers });
};

export const plausibleRequestMiddleware = (
	request: Request,
	response: Response,
	next: NextFunction,
) => {
	response.on('finish', () => {
		void sendPlausibleEvent(request, response).catch((error: unknown) => {
			console.error('Failed to send Plausible event:', error);
		});
	});

	next();
};
