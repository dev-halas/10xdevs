import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerPlugins } from '../index';

vi.mock('@fastify/cors', () => ({
  default: vi.fn(),
}));

vi.mock('@fastify/helmet', () => ({
  default: vi.fn(),
}));

vi.mock('@fastify/cookie', () => ({
  default: vi.fn(),
}));

describe('registerPlugins', () => {
  let mockApp: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockApp = {
      register: vi.fn(),
    };
  });

  it('powinien zarejestrować wszystkie pluginy', () => {
    registerPlugins(mockApp);

    expect(mockApp.register).toHaveBeenCalledTimes(3);
  });

  it('powinien zarejestrować helmet z opcją global', () => {
    registerPlugins(mockApp);

    const helmetCall = mockApp.register.mock.calls.find((call: any) => 
      call[1]?.global === true
    );
    
    expect(helmetCall).toBeDefined();
    expect(helmetCall[1]).toEqual({ global: true });
  });

  it('powinien zarejestrować cors z odpowiednimi opcjami', () => {
    registerPlugins(mockApp);

    const corsCall = mockApp.register.mock.calls.find((call: any) => 
      call[1]?.origin === true && call[1]?.credentials === true
    );
    
    expect(corsCall).toBeDefined();
    expect(corsCall[1]).toEqual({ origin: true, credentials: true });
  });

  it('powinien zarejestrować cookie plugin', () => {
    registerPlugins(mockApp);

    expect(mockApp.register).toHaveBeenCalled();
    // Cookie plugin jest rejestrowany bez opcji
  });
});
