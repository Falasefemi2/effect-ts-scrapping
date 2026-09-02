# Troubleshooting Guide

## Common Issues

### Puppeteer Installation Issues

**Problem**: Puppeteer fails to download Chromium

**Solution**:
```bash
# Clear the cache and reinstall
rm -rf node_modules .bun
bun install
```

### Proxy Connection Errors

**Problem**: "Failed to authenticate with proxy"

**Solution**:
1. Verify your Bright Data credentials in `.env`
2. Check that your IP is whitelisted
3. Ensure the zone is active
4. Try without proxy first to isolate the issue

### Timeout Errors

**Problem**: "Navigation timeout exceeded"

**Solutions**:
- Increase the `NAVIGATION_TIMEOUT` in your configuration
- Check your network connection
- Verify the target URL is accessible
- Try a simpler URL first to test the setup

### Rate Limiting (429 Errors)

**Problem**: Getting HTTP 429 responses

**Solutions**:
- Implement exponential backoff retry logic
- Use Bright Data's proxy rotation for better success rates
- Add delays between requests
- Check target site's robots.txt and rate limits

### IP Blocking (403 Errors)

**Problem**: Getting HTTP 403 (IP blocked) responses

**Solution**: Use Bright Data proxy service to rotate IPs

## Performance Tips

### Optimize for Production

1. **Connection Pooling**: Reuse browser instances
   ```typescript
   // Create one browser instance and reuse it
   const browser = await puppeteer.launch();
   ```

2. **Batch Processing**: Process multiple URLs efficiently
   ```typescript
   // Queue URLs and process with controlled concurrency
   ```

3. **Memory Management**: Close unused resources
   ```typescript
   // Always close pages and browser
   await page.close();
   await browser.close();
   ```

4. **Caching**: Cache results to avoid redundant scrapes

## Debugging

### Enable Verbose Logging

Modify `index.ts` to add more debug output:
```typescript
const program = Effect.gen(function* () {
  yield* Effect.logDebug("Starting scraper...")
  // ... rest of code
})
```

### Inspect Network Requests

```typescript
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.status(), response.url());
});
```

## Getting Help

- Check existing issues on GitHub
- Review Effect-TS documentation
- Check Puppeteer documentation
- Ask in GitHub Discussions
