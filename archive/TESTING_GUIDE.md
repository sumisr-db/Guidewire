# Testing Guide - Local S3 (MinIO) Setup

## ✅ Setup Complete!

All services are now running and ready for testing:

### Running Services
- ✅ **Docker**: Running
- ✅ **MinIO S3 API**: http://127.0.0.1:9000
- ✅ **MinIO Console**: http://127.0.0.1:9001
- ✅ **Backend API**: http://localhost:8000
- ✅ **Frontend UI**: http://localhost:5173

### MinIO Configuration
- **Buckets Created**:
  - `guidewire-cda` (for CDA manifests)
  - `guidewire-delta` (for Delta tables)
- **Credentials**:
  - Username: `minioadmin`
  - Password: `minioadmin`

---

## 🧪 Testing Steps

### 1. Open the Frontend
```
Open in browser: http://localhost:5173
```

### 2. Navigate to Guidewire Jobs Page
- Click on "Guidewire Connector" or navigate to `/guidewire`

### 3. Start a New Job
- Click **"+ Start New Job"** button
- You should see the job configuration form with tabs

### 4. Verify Local MinIO Tab (Default)
- **Tab should be selected**: "Local S3 (MinIO)"
- **Green alert** should show: "Development Mode: Using local MinIO for testing..."
- **Pre-filled fields**:
  - MinIO Endpoint: `http://127.0.0.1:9000`
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin`
  - Region: `us-east-1`
  - Manifest Bucket: `guidewire-cda`
  - Target Bucket: `guidewire-delta`

### 5. Test Provider Switching
- Click **"AWS S3"** tab
- **Blue alert** should show: "Production Mode: Using AWS S3..."
- Fields should be **empty** (except defaults)
- Click back to **"Local S3 (MinIO)"** tab
- MinIO defaults should be restored

### 6. Submit a Test Job (Without Data)
- Keep **"Local S3 (MinIO)"** tab selected
- Keep all default values
- Check both checkboxes:
  - ✅ Use Ray Parallel Processing
  - ✅ Show Progress
- Click **"Start Processing"**

**Expected Result**:
- ✅ Job should be created successfully
- ✅ Buckets auto-created if they don't exist
- ✅ You'll be redirected back to jobs list
- ✅ New job appears with status "pending" or "running"

**Note**: The job will likely fail quickly because there's no data in the buckets, but that's okay! We're testing the S3 integration.

### 7. Check Job Details
- Click on the newly created job
- **Verify Configuration Card shows**:
  - 🟢 Server icon for Local MinIO
  - Badge: "Local MinIO (http://127.0.0.1:9000)"
  - Manifest Bucket: `guidewire-cda`
  - Target Bucket: `guidewire-delta`
  - Region: `us-east-1`
  - Processing Mode: ⚡ Ray Parallel

### 8. Check Backend Logs
```bash
tail -f /tmp/databricks-app-watch.log
```

Look for:
- ✅ S3 connection validation
- ✅ Bucket creation logs
- ✅ Job start messages
- ✅ MinIO endpoint configuration

---

## 🎨 UI Testing Checklist

### General UI
- [ ] Page loads without errors
- [ ] "Start New Job" button works
- [ ] Form appears/disappears correctly

### Provider Tabs
- [ ] "Local S3 (MinIO)" tab works
- [ ] "AWS S3" tab works
- [ ] Switching tabs changes form fields
- [ ] Green alert shows for Local tab
- [ ] Blue alert shows for AWS tab

### Form Validation
- [ ] Required fields validated
- [ ] Error messages display clearly
- [ ] Can't submit empty form

### Job Submission
- [ ] Form submits successfully
- [ ] Loading state shows during submission
- [ ] Redirects to jobs list on success
- [ ] Error messages show on failure

### Job Display
- [ ] Jobs list shows all jobs
- [ ] Progress bars animate
- [ ] Status badges show correct colors
- [ ] Job cards are clickable

### Job Details
- [ ] Provider icon shows (Server/Cloud)
- [ ] Provider badge displays correctly
- [ ] Configuration shows all S3 details
- [ ] Progress displays correctly

---

## 🔍 API Testing with curl

### Test Backend Directly

#### 1. Health Check
```bash
curl http://localhost:8000/health | jq
```

**Expected**:
```json
{"status": "healthy"}
```

#### 2. List Jobs
```bash
curl http://localhost:8000/api/guidewire/jobs | jq
```

#### 3. Start Job with Local MinIO
```bash
curl -X POST http://localhost:8000/api/guidewire/jobs/start \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "s3_config": {
        "provider": "local",
        "endpoint_url": "http://127.0.0.1:9000",
        "access_key_id": "minioadmin",
        "secret_access_key": "minioadmin",
        "region": "us-east-1",
        "manifest_bucket": "guidewire-cda",
        "target_bucket": "guidewire-delta",
        "manifest_prefix": "cda/",
        "target_prefix": "target/",
        "use_ssl": false,
        "verify_ssl": false
      },
      "parallel": true,
      "show_progress": true,
      "ray_dedup_logs": "0",
      "table_names": null,
      "exceptions": null,
      "largest_tables_first_count": null
    }
  }' | jq
```

**Expected Response**:
```json
{
  "job_id": "uuid-here",
  "status": "pending",
  "message": "Processing job started with ID: uuid-here using Local MinIO (http://127.0.0.1:9000)"
}
```

#### 4. Get Job Status
```bash
# Replace JOB_ID with actual job ID from previous response
curl http://localhost:8000/api/guidewire/jobs/JOB_ID | jq
```

---

## 🌐 MinIO Console Testing

### Access MinIO Web Console
```
URL: http://127.0.0.1:9001
Username: minioadmin
Password: minioadmin
```

### Verify Buckets
1. Login to MinIO Console
2. Click on "Buckets" in left sidebar
3. You should see:
   - `guidewire-cda`
   - `guidewire-delta`

### Check Bucket Contents
- Click on `guidewire-cda`
- You should see `cda/` prefix (currently empty)
- Click on `guidewire-delta`
- You should see `target/` prefix (currently empty)

---

## 📊 Expected Behavior

### Job Without Data
If you start a job with empty buckets:
- ✅ Job creates successfully
- ✅ Buckets verified/created
- ✅ Job status shows "running" or "pending"
- ⚠️ Job will fail quickly (no tables to process)
- ✅ Error message: "No tables found" or similar

This is **expected and correct**! It proves:
- ✅ S3 connection works
- ✅ Bucket creation works
- ✅ API integration works
- ✅ Frontend-backend communication works

### Job With Data (Optional)
To test with actual data, you need to:
1. Have AWS credentials configured
2. Run: `./scripts/copy_test_data_from_aws.sh`
3. Choose number of files to copy (start with 5-10)
4. Start a new job
5. Job should process the tables successfully

---

## 🐛 Troubleshooting

### Frontend Not Loading
```bash
# Check if frontend is running
ps aux | grep vite
# If not, restart watch.sh
pkill -f watch.sh
nohup ./watch.sh > /tmp/databricks-app-watch.log 2>&1 &
```

### Backend Not Responding
```bash
# Check if backend is running
ps aux | grep uvicorn
# Check logs
tail -50 /tmp/databricks-app-watch.log
```

### MinIO Not Accessible
```bash
# Check MinIO container
docker ps | grep minio
# If not running
docker start minio
# Or re-run setup
./scripts/setup_minio.sh
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :9000  # MinIO S3 API
lsof -i :9001  # MinIO Console
```

### Job Submission Fails
1. Check browser console for errors
2. Check network tab for API response
3. Check backend logs: `tail -f /tmp/databricks-app-watch.log`
4. Verify MinIO is running: `curl http://127.0.0.1:9000/minio/health/ready`

---

## ✅ Success Indicators

You know the integration is working when:

### Frontend
- [x] Tabs switch smoothly between Local/AWS
- [x] Default values pre-fill correctly
- [x] Form submits without console errors
- [x] Jobs appear in list
- [x] Job details show provider info

### Backend
- [x] `/health` endpoint returns `{"status": "healthy"}`
- [x] Jobs API returns list of jobs
- [x] Job submission creates job
- [x] Logs show S3 validation messages
- [x] Logs show bucket creation messages

### MinIO
- [x] Console accessible at :9001
- [x] Buckets visible in console
- [x] S3 API responds at :9000
- [x] `mc ls local/` shows buckets

---

## 📝 Manual Test Results Template

Copy this and fill it out:

```
## Test Execution - [Date]

### Environment
- MinIO Status: [ ] Running / [ ] Not Running
- Backend Status: [ ] Running / [ ] Not Running
- Frontend Status: [ ] Running / [ ] Not Running

### Provider Tab Switching
- Local → AWS: [ ] Pass / [ ] Fail
- AWS → Local: [ ] Pass / [ ] Fail
- Defaults Restore: [ ] Pass / [ ] Fail

### Job Submission (Local MinIO)
- Form Validation: [ ] Pass / [ ] Fail
- Submit Button: [ ] Pass / [ ] Fail
- Job Created: [ ] Pass / [ ] Fail
- Job ID: _______________

### Job Details Page
- Provider Badge: [ ] Pass / [ ] Fail
- Configuration Display: [ ] Pass / [ ] Fail
- Buckets Display: [ ] Pass / [ ] Fail

### API Testing
- Health Check: [ ] Pass / [ ] Fail
- List Jobs: [ ] Pass / [ ] Fail
- Job Status: [ ] Pass / [ ] Fail

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Overall Result
- [ ] All Tests Pass
- [ ] Some Issues (list above)
- [ ] Major Issues (blocking)
```

---

## 🎉 Next Steps After Testing

Once testing is successful:

1. **Add Real Data** (Optional)
   - Configure AWS credentials
   - Run `./scripts/copy_test_data_from_aws.sh`
   - Test with actual CDA processing

2. **Test AWS S3 Mode** (Optional)
   - Switch to AWS S3 tab
   - Enter production credentials
   - Verify job runs with AWS

3. **Deploy to Production**
   - Run `./deploy.sh`
   - Test deployed app
   - Monitor logs with `dba_logz.py`

4. **Add Enhancements**
   - Connection test button
   - Config presets
   - Better error messages
   - etc.

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review logs: `/tmp/databricks-app-watch.log`
3. Check MinIO console: http://127.0.0.1:9001
4. Review Phase 1 & 2 summaries
5. Check documentation in `docs/`

---

**Happy Testing!** 🎊
