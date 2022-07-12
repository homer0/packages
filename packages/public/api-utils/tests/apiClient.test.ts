jest.unmock('../src/apiClient');
jest.unmock('../src/endpointsGenerator');

import fetchMock from 'jest-fetch-mock';
import { APIClient, apiClient, type APIClientBodyInit } from '../src/apiClient';

describe('APIClient', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('should be instantiated with a base URL, endpoints and a fetch client', () => {
    // Given
    const url = 'http://example.com';
    const endpoints = {
      one: '/one',
      two: '/two',
    };
    // When
    const sut = new APIClient({
      url,
      endpoints,
      fetchClient: fetch,
    });
    // Then
    expect(sut).toBeInstanceOf(APIClient);
    expect(sut.endpoint('one')).toBe(`${url}${endpoints.one}`);
    expect(sut.getUrl()).toBe(url);
    expect(sut.getEndpoints()).toEqual(endpoints);
    expect(sut.getFetchClient()).toBe(fetch);
  });

  it('should be able to set and remove an authorization token', () => {
    // Given
    const token = '25-09-2015&06-09-2019';
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    sut.setAuthorizationToken(token);
    const tokenAfterSet = sut.getAuthorizationToken();
    sut.setAuthorizationToken();
    const tokenAfterRemove = sut.getAuthorizationToken();
    // Then
    expect(tokenAfterSet).toBe(token);
    expect(tokenAfterRemove).toBe('');
  });

  it('should be able to set and remove custom base headers', () => {
    // Given
    const baseHeaders = {
      'x-date-1': '25-09-2015',
      'x-date-2': '06-09-2019',
    };
    const extraHeaders = {
      'x-name-1': 'Charito',
      'x-name-2': 'Pilar',
    };
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    sut.setDefaultHeaders(baseHeaders);
    const headersAfterFirstSet = sut.getDefaultHeaders();
    sut.setDefaultHeaders(extraHeaders, false);
    const headersAfterSecondSet = sut.getDefaultHeaders();
    sut.setDefaultHeaders(baseHeaders);
    const headersAfterSetWithOverwrite = sut.getDefaultHeaders();
    sut.setDefaultHeaders();
    const headersAfterRemove = sut.getDefaultHeaders();
    // Then
    expect(headersAfterFirstSet).toEqual(baseHeaders);
    expect(headersAfterSecondSet).toEqual({ ...baseHeaders, ...extraHeaders });
    expect(headersAfterSetWithOverwrite).toEqual(baseHeaders);
    expect(headersAfterRemove).toEqual({});
  });

  it('should make a successful GET request', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.get(requestURL);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      method: 'GET',
    });
  });

  it('should make a successful GET request without decoding the response', async () => {
    // Given
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.get('http://example.com', { json: false });
    // Then
    expect(response).toBeInstanceOf(Response);
  });

  it('should make a GET request and return an empty object if JSON.parse fails', async () => {
    // Given
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: 'invalid-json',
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.get('http://example.com');
    // Then
    expect(response).toEqual({});
  });

  it('should make a successful POST request', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.post(requestURL, requestBody);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  });

  it('should make a successful POST request with custom headers', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = {
      prop: 'value',
    };
    const requestHeaders = {
      'x-date': '25-09-2015',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const token = 'abc123';
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    sut.setAuthorizationToken(token);
    const response = await sut.post(requestURL, requestBody, {
      headers: requestHeaders,
    });
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...requestHeaders,
      },
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  });

  it('should make a failed GET request', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      error: 'Something went terribly wrong!',
    };
    const errorStatus = 404;
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: errorStatus,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    expect.assertions(2);
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    try {
      await sut.get(requestURL);
    } catch (error) {
      // Then
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        `[${errorStatus}]: ${requestResponseData.error}`,
      );
    }
  });

  it('should make a failed GET request with an uknown message', async () => {
    // Given
    const requestURL = 'http://example.com';
    const errorStatus = 404;
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: errorStatus,
        },
      }),
    );
    expect.assertions(2);
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    try {
      await sut.get(requestURL);
    } catch (error) {
      // Then
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(`[${errorStatus}]: Unknown error`);
    }
  });

  it("shouldn't overwrite the content type if it was already set", async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    const headers = {
      'Content-Type': 'application/charito',
    };
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.post(requestURL, requestBody, { headers });
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers,
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  });

  it("shouldn't overwrite the content type nor encode the body if is not an object", async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = 'Hello Charito!';
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.post(requestURL, requestBody);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      method: 'POST',
      body: requestBody,
    });
  });

  it("shouldn't encode the body if is not an object literal", async () => {
    // Given
    const requestURL = 'http://example.com';
    /**
     * A custom format that the API won't try to encode.
     */
    class CustomFormData {}
    const requestBody = new CustomFormData();
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    const headers = {
      'Content-Type': 'application/custom-form-data',
    };
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.post(requestURL, requestBody as APIClientBodyInit, {
      headers,
    });
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers,
      method: 'POST',
      body: requestBody,
    });
  });

  it('should make a successful PUT request using the shortcut method', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.put(requestURL, requestBody);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
  });

  it('should make a successful PATCH request using the shortcut method', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.patch(requestURL, requestBody);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    });
  });

  it('should make a successful DELETE request using the shortcut method', async () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      message: 'hello-world',
    };
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
        body: JSON.stringify(requestResponseData),
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    const response = await sut.delete(requestURL);
    // Then
    expect(response).toEqual(requestResponseData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  });

  it('should make a successful HEAD request using the shortcut method', async () => {
    // Given
    const requestURL = 'http://example.com';
    fetchMock.mockResponseOnce(() =>
      Promise.resolve({
        init: {
          status: 200,
        },
      }),
    );
    // When
    const sut = new APIClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    await sut.head(requestURL);
    // Then
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(requestURL, {
      method: 'HEAD',
    });
  });

  it('should have a shorthand function', () => {
    // Given/When
    const sut = apiClient({
      url: '',
      endpoints: {},
      fetchClient: fetch,
    });
    // Then
    expect(sut).toBeInstanceOf(APIClient);
  });
});
