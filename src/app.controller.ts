import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IncomingMessage } from 'http';
import { request } from 'https';

// 定义接口类型
interface NetworkTestResult {
  name: string;
  success: boolean;
  response?: string;
  error?: string;
}

interface NetworkTestResponse {
  success: boolean;
  message: string;
  tests: NetworkTestResult[];
  timestamp: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-network')
  async testNetwork(): Promise<NetworkTestResponse> {
    try {
      console.log('Testing internet connectivity from Lambda...');

      // 测试多个外网服务
      const testPromises = [
        this.testEndpoint('GitHub API', 'https://api.github.com/zen'),
        this.testEndpoint('NPM Registry', 'https://registry.npmjs.org'),
        this.testEndpoint('HTTPBin', 'https://httpbin.org/ip'),
      ];

      const tests = await Promise.allSettled(testPromises);

      const results: NetworkTestResult[] = tests.map((test, index) => {
        const names = ['GitHub API', 'NPM Registry', 'HTTPBin'];

        if (test.status === 'fulfilled') {
          return {
            name: names[index],
            success: true,
            response: test.value.substring(0, 100),
          };
        } else {
          const error = test.reason as Error;
          return {
            name: names[index],
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      const successCount = results.filter((r) => r.success).length;

      return {
        success: successCount > 0,
        message: `${successCount}/${results.length} tests passed`,
        tests: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Network test failed:', error);
      return {
        success: false,
        message: 'Network test failed',
        tests: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  private testEndpoint(name: string, url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      console.log(`Testing ${name}: ${url}`);

      const req = request(url, (res: IncomingMessage) => {
        let data = '';

        res.on('data', (chunk: Buffer | string) => {
          data += chunk.toString();
        });

        res.on('end', () => {
          console.log(`✅ ${name} success`);
          resolve(data);
        });

        res.on('error', (error: Error) => {
          console.log(`❌ ${name} response error:`, error.message);
          reject(error);
        });
      });

      req.on('error', (error: Error) => {
        console.log(`❌ ${name} request failed:`, error.message);
        reject(error);
      });

      req.setTimeout(10000, () => {
        console.log(`⏰ ${name} timeout`);
        req.destroy();
        reject(new Error(`${name} request timeout`));
      });

      req.end();
    });
  }
}
