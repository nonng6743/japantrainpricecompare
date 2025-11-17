import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run both KKDay and Klook price update loops concurrently
 */
(async () => {
  try {
    console.log('🚀 Starting all price update loops concurrently...');
    console.log('📅 Time:', new Date().toISOString());
    console.log('='.repeat(60));
    console.log('🔄 Running KKDay and Klook updates in parallel...\n');

    const kkdayScript = path.join(__dirname, 'loopUpdatePrice_Kkday.js');
    const klookScript = path.join(__dirname, 'loopUpdatePrice_Klook.js');

    // Spawn both processes concurrently
    const kkdayProcess = spawn('node', [kkdayScript], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    const klookProcess = spawn('node', [klookScript], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env }
    });

    // Track exit codes
    let kkdayExitCode = null;
    let klookExitCode = null;

    kkdayProcess.on('exit', (code) => {
      kkdayExitCode = code;
      console.log(`\n🟦 KKDay process exited with code: ${code}`);
      checkAllComplete();
    });

    klookProcess.on('exit', (code) => {
      klookExitCode = code;
      console.log(`\n🟧 Klook process exited with code: ${code}`);
      checkAllComplete();
    });

    kkdayProcess.on('error', (error) => {
      console.error('❌ Error spawning KKDay process:', error);
      kkdayExitCode = 1;
      checkAllComplete();
    });

    klookProcess.on('error', (error) => {
      console.error('❌ Error spawning Klook process:', error);
      klookExitCode = 1;
      checkAllComplete();
    });

    function checkAllComplete() {
      if (kkdayExitCode !== null && klookExitCode !== null) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL SUMMARY');
        console.log('='.repeat(60));
        console.log(`🟦 KKDay exit code: ${kkdayExitCode}`);
        console.log(`🟧 Klook exit code: ${klookExitCode}`);
        console.log('='.repeat(60));
        
        // Exit with error code if any process failed
        const exitCode = (kkdayExitCode !== 0 || klookExitCode !== 0) ? 1 : 0;
        process.exit(exitCode);
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
