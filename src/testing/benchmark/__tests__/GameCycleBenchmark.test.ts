import { GameCycleBenchmark } from '../GameCycleBenchmark';
import { LoadTester } from '../LoadTester';

describe('GameCycleBenchmark', () => {
    let benchmark: GameCycleBenchmark;

    beforeEach(() => {
        benchmark = new GameCycleBenchmark();
    });

    afterEach(() => {
        benchmark.stopBenchmark();
    });

    it('should start and stop benchmark', () => {
        expect(() => benchmark.startBenchmark()).not.toThrow();
        expect(() => benchmark.stopBenchmark()).not.toThrow();
    });

    it('should emit cycle timing events', (done) => {
        benchmark.on('cycleTiming', (metrics) => {
            expect(metrics).toHaveProperty('cycleDuration');
            expect(metrics).toHaveProperty('deviation');
            benchmark.stopBenchmark();
            done();
        });

        benchmark.startBenchmark();
    });

    it('should emit resource metrics events', (done) => {
        benchmark.on('resourceMetrics', (metrics) => {
            expect(metrics).toHaveProperty('cpuUsage');
            expect(metrics).toHaveProperty('memoryUsage');
            benchmark.stopBenchmark();
            done();
        });

        benchmark.startBenchmark();
    });

    it('should generate complete benchmark report', (done) => {
        benchmark.on('benchmarkComplete', (report: any) => {
            expect(report).toHaveProperty('totalCycles');
            expect(report).toHaveProperty('timingStats');
            expect(report).toHaveProperty('resourceStats');
            expect(report).toHaveProperty('recommendations');
            done();
        });

        benchmark.startBenchmark();
        setTimeout(() => benchmark.stopBenchmark(), 200); // Run for 200ms
    });
});

describe('LoadTester', () => {
    it('should run load test without errors', async () => {
        const loadTester = new LoadTester(5, 2); // 5 players, 2 actions per cycle
        await expect(loadTester.runLoadTest(0.5)).resolves.not.toThrow(); // Run for 0.5 seconds
    });
});