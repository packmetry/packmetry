# Packmetry Authority Index

This file exists to prevent old CartonLab material from being accidentally treated as equal to current Packmetry authority.

## Highest active authority

`PACKMETRY_NEW_PROJECT_CHAT_BOOTSTRAP.md`

It controls:
- final brand and domain;
- repository name;
- authority hierarchy;
- current development workflow;
- current design status;
- Git/GitHub review policy;
- phase order and stop conditions.

## Detailed legacy product specification

`CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md`

This is retained because it contains the detailed mature product requirements. It is subordinate to the Packmetry bootstrap. Interpret the old `CartonLab` name as `Packmetry` unless the context is explicitly historical.

## Conflict rule

If the two files conflict, the Packmetry bootstrap wins. If a material ambiguity remains after applying the hierarchy, stop and ask instead of inventing a rule.

## Files deliberately NOT promoted into active authority

Older CartonLab Cline prompts, README files, architecture notes, and implementation logs from the previous local experiment are not copied into the active Packmetry repository foundation. They were useful for the old setup but contain obsolete authority paths/naming and could confuse an implementation agent.

The exact duplicate `CARTONLAB_MASTER_SPEC.md` supplied with the old bootstrap is also omitted because it is byte-for-byte identical to the retained `CARTONLAB_ULTIMATE_PROJECT_SPECIFICATION.md` in the supplied set.
