# Celery 5.5.3 Upgrade - Quick Fix Guide

**Critical**: One code change required before upgrading

---

## Required Code Fix

### File: `apps/backend/tasks/chat_tasks.py`

**Line 236** - Replace `asyncio.run()` pattern

#### BEFORE (BREAKS in Celery 5.5.3):
```python
answer, ai_metadata = asyncio.run(generate_ai_response(
    messages=messages,
    model_preference=model_preference,
    temperature=0.7 if personality_id == 'dr_gasnelio' else 0.8,
    max_tokens=1000
))
```

#### AFTER (SAFE in Celery 5.5.3):
```python
loop = asyncio.get_event_loop()
answer, ai_metadata = loop.run_until_complete(generate_ai_response(
    messages=messages,
    model_preference=model_preference,
    temperature=0.7 if personality_id == 'dr_gasnelio' else 0.8,
    max_tokens=1000
))
```

---

## Why This Change?

**Problem**: `asyncio.run()` creates a new event loop, which conflicts with Celery's worker event loop in version 5.5.3

**Impact**: Without this fix:
- Medical AI responses will fail with `RuntimeError: Event loop is already running`
- Dr. Gasnelio and Gá personas won't respond
- Medical dosage calculations will break

**Solution**: Use the existing event loop instead of creating a new one

---

## Testing the Fix

### Local Test:
```bash
cd apps/backend

# Start Celery worker
celery -A celery_config worker --loglevel=INFO

# In another terminal, test the task
python -c "
from tasks.chat_tasks import process_question_async
result = process_question_async.delay(
    'Como administrar PQT-U?',
    'dr_gasnelio',
    'test-001'
)
print(result.get(timeout=60))
"
```

### Expected Result:
✅ Task completes successfully
✅ AI response generated
✅ No asyncio errors in logs

---

## Upgrade Steps

1. **Apply code fix** (above)
2. **Update requirements.txt**:
   ```diff
   - celery==5.3.4
   + celery==5.5.3
   ```
3. **Test locally** (see above)
4. **Deploy to staging**
5. **Monitor and validate**
6. **Deploy to production**

---

## Rollback

If issues occur:
```bash
git checkout HEAD~1 apps/backend/tasks/chat_tasks.py
pip install celery==5.3.4
```

---

**Full Analysis**: See `CELERY_UPGRADE_ANALYSIS_5.3.4_TO_5.5.3.md`
