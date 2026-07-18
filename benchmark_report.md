# OWASP NodeGoat Real-Data Benchmark Report (legacy-js-modernizer)

Source analyzed: https://raw.githubusercontent.com/OWASP/NodeGoat/master/app/routes/allocations.js

**Known real vulnerability in this file**: Insecure Direct Object Reference (IDOR) - it reads `userId` from `req.params` (the URL) instead of the authenticated session, so any logged-in user can view any other user's data by editing the URL. This is NodeGoat's own documented A4/IDOR tutorial exercise (the fix is commented out directly above the vulnerable line in the source).

**Did Claude's analysis surface this specific issue?** YES (matched concepts: ['insecure direct object reference', 'idor', 'direct object reference', 'authorization', 'req.params', 'session', 'any user', 'other user'])

This is a pass/fail check on one real, documented case - not a statistical benchmark like the other repos' real-data tests.

## Claude's full analysis

Summary: This is an Express.js route handler that retrieves and displays financial/resource allocation data for a user. It takes a userId from the URL path parameters and an optional threshold from query parameters, queries a database through a DAO layer, and renders the results using a template. There's a commented-out fix indicating awareness of a security issue.

Vulnerabilities found:
- Insecure Direct Object Reference (IDOR): The userId is taken from req.params instead of req.session, allowing any authenticated user to view other users' allocation data by manipulating the URL (e.g., /allocations/123 vs /allocations/456). The commented code shows developers knew about this vulnerability but the fix is not active.
- Missing Authorization Check: There is no verification that the authenticated user has permission to view the requested userId's allocations. Any user can access any other user's sensitive financial/allocation data.
- SQL/NoSQL Injection Risk: The threshold parameter from req.query is passed directly to allocationsDAO.getByUserIdAndThreshold() without validation or sanitization. Depending on how the DAO constructs queries, this could enable injection attacks if threshold is used in a dynamic query without proper parameterization.
- Server-Side Template Injection Risk: The environmentalScripts variable from config is passed directly to the template renderer without apparent sanitization. If this config value can be influenced by user input or external sources, it could lead to template injection attacks.
- Information Disclosure: Error objects are passed directly to next(err) which may expose stack traces, database details, or internal system information to users if error handling middleware is not properly configured.
- Missing Input Validation: Neither userId nor threshold parameters are validated for type, format, or range before being used in database queries and template rendering, which could lead to unexpected behavior or exploitation.
- No Rate Limiting: There's no apparent rate limiting on this endpoint, allowing an attacker to enumerate all user IDs and scrape allocation data for the entire user base through automated requests.
