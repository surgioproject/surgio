{% macro main(rule1, rule2) %}
DOMAIN,example1.com,{{ rule1 }}
DOMAIN,example2.com,{{ rule2 }}
{% endmacro %}
