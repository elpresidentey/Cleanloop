# Health Check Endpoints

This document describes health check endpoints and monitoring capabilities for the CleanLoop Platform.

## Overview

Health checks are used to monitor the status of the application and its dependencies. These endpoints can be used by monitoring services, load balancers, and deployment pipelines.

## Available Endpoints

### Frontend Health Check

Since CleanLoop is a client-side React application, health checks are primarily handled client-side through:

1. **Application Status**: Check if the application loads correctly
2. **Dependency Checks**: Verify Supabase and Convex connections
3. **Error Monitoring**: Sentry integration for error tracking

## Monitoring Services

### Sentry Error Monitoring

Sentry is integrated for production error monitoring. To set it up:

1. Get your Sentry DSN from https://sentry.io/settings/projects/
2. Add it to your environment variables:
   ```env
   VITE_SENTRY_DSN=your_sentry_dsn_here
   ```
3. Sentry will automatically track:
   - JavaScript errors
   - Performance issues
   - User sessions
   - Error context and stack traces

### Google Analytics

For user behavior and performance tracking:

1. Get your Measurement ID from Google Analytics
2. Add it to your environment variables:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

## Manual Health Checks

### Check Application Status

1. **Load the application**: Navigate to your deployed URL
2. **Check browser console**: Should have no errors
3. **Test authentication**: Login should work
4. **Test data loading**: Dashboard should load data

### Check Dependencies

#### Supabase Connection
- Open browser DevTools → Network tab
- Look for requests to `*.supabase.co`
- Should return 200 status codes
- Check console for Supabase connection errors

#### Convex Connection
- Open browser DevTools → Network tab
- Look for requests to `*.convex.cloud`
- Should return 200 status codes

## Production Monitoring Checklist

- [ ] Sentry is configured and receiving errors
- [ ] Google Analytics is tracking page views
- [ ] No console errors in production
- [ ] Supabase connection is stable
- [ ] Convex connection is stable
- [ ] Error boundaries are catching errors
- [ ] Performance metrics are acceptable (Lighthouse score > 90)

## Uptime Monitoring

Recommended services for uptime monitoring:

1. **UptimeRobot**: https://uptimerobot.com
   - Free tier: 50 monitors
   - Check your application URL every 5 minutes

2. **Pingdom**: https://www.pingdom.com
   - More advanced features
   - Better alerting options

3. **StatusCake**: https://www.statuscake.com
   - Free tier available
   - Good notification options

## Alerting

### Sentry Alerts

Configure alerts in Sentry dashboard:
- Critical errors: Immediate email/Slack notification
- Error spikes: Notify when error rate increases significantly
- Performance degradation: Alert on slow response times

### Custom Alerts

You can set up custom monitoring using:
- Vercel Analytics (built-in)
- Custom webhook endpoints
- External monitoring services

## Troubleshooting

### Application Not Loading

1. Check environment variables are set correctly
2. Verify build completed successfully
3. Check browser console for errors
4. Verify Supabase and Convex URLs are correct

### Errors Not Appearing in Sentry

1. Verify `VITE_SENTRY_DSN` is set
2. Check Sentry project settings
3. Verify errors are actually occurring
4. Check browser console for Sentry initialization messages

### Analytics Not Tracking

1. Verify `VITE_GA_MEASUREMENT_ID` is set
2. Check Google Analytics real-time reports
3. Verify no ad blockers are interfering
4. Check browser console for GA initialization

## Best Practices

1. **Monitor Regularly**: Check monitoring dashboards daily
2. **Set Up Alerts**: Configure alerts for critical issues
3. **Review Error Reports**: Regularly review and fix errors
4. **Performance Monitoring**: Track and optimize performance metrics
5. **User Feedback**: Monitor user complaints and issues

## Support

For monitoring and health check issues, contact:
- **Email**: support@cleanloop.ng
- **Documentation**: See README.md for setup instructions

