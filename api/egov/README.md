# eGov PH Service Catalog Client (placeholder)

Implement the eGov service-catalog lookup here. See `../README.md` for the full
contract.

Checklist when implementing:

- [ ] Input: `egov_search_term` from each generated step.
- [ ] Output: official service URL → set `JourneyStep.egov_url`.
- [ ] Fallback: agency homepage when no result (silent, no user-facing error).
- [ ] Authentication: as provided by DICT at hackathon registration.
