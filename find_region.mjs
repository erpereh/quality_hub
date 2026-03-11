import pg from 'pg';
const { Client } = pg;

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1'
];

async function findRegion() {
  for (const region of regions) {
    const connStr = "postgresql://postgres.rxdnylmzkqevzrlxwyri:Onces19982004!@aws-0-" + region + ".pooler.supabase.com:6543/postgres";
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    
    try {
      await client.connect();
      console.log("✅ SUCCESS: Correct region is " + region);
      await client.query("SELECT 1");
      await client.end();
      return region;
    } catch (err) {
      if (!err.message.includes('Tenant or user not found') && !err.message.includes('getaddrinfo')) {
        console.log("⚠️ unexpected error on " + region + ": " + err.message);
      } else {
         process.stdout.write('.');
      }
    }
  }
  console.log('❌ Could not find region');
  return null;
}

findRegion();
