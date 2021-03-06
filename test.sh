#!/bin/env bash
set -e

declare -a requests
declare -a queries

function req {
  queries+=("$1")
  requests+=("`eval $1`")
}

function last {
  echo "${requests[-1]}"
}

function url {
  echo "curl -s $(header "$2") \"localhost:5555${1}\""
}

function header {
  echo "$([ ! -z "$1" ] && echo "-H \"Authorization: Bearer $1\" " || echo "")"
}

function data {
  args="$(echo $@|sed 's/ //g')"
  # >&2 echo "$args"
  postbody=" -H 'Content-Type: application/json' -d '$(echo $args)' "
  echo "$([ ! -z "$args" ] && echo "$postbody" || echo "")"
}

function get {
  req "$(url "$1" "$2")"
}

function delete {
  req "$(url "$1" "$2") -XDELETE $(data $(echo "$3"))"
}

function post {
  req "$(url "$1" "$2") -XPOST $(data $(echo "$3"))"
}

function put {
  req "$(url "$1" "$2") -XPUT $(data $(echo "$3"))"
}

function patch {
  req "$(url "$1" "$2") -XPATCH $(data $(echo "$3"))"
}

function strip {
  read string && echo $string|sed 's/^\"//'|sed 's/\"$//'
}

function print {
  echo && echo "$1:"
}

echo "clear redis"
docker exec -it `docker ps --filter name="$(basename $(pwd))_redis" --format={{.ID}}` redis-cli flushall &> /dev/null

echo "create user 1"
post "/user" "" '{"name":"user_1","p1":"xxxXx_111","p2":"xxxXx_111"}'
header_1=`last`

echo "create user 2"
post "/user" "" '{"name":"user_2","p1":"xxxXx_222","p2":"xxxXx_222"}'
header_2=`last`

echo "create user 3"
post "/user" "" '{"name":"user_3","p1":"xxxXx_333","p2":"xxxXx_333"}'
header_3=`last`

echo "create user 4"
post "/user" "" '{"name":"user_4","p1":"xxxXx_444","p2":"xxxXx_444"}'
header_4=`last`


print "create group"
post "/group" $header_1 '{"name":"dennis"}'
group=`last|jq .id|strip`
echo $group

print "user 2 join group"
put "/group/${group}" $header_2
last

owner=`last|jq .owner|strip`
user_1=`last|jq .users[0].id|strip`
user_2=`last|jq .users[1].id|strip`

print "change owner (was ${owner})"
patch "/group/${group}" $header_1 "{\"owner\":\"${user_2}\"}"
last|jq .owner|strip

owner=$header_2

print "revert owner"
patch "/group/${group}" $header_2 "{\"owner\":\"${user_1}\"}"
last|jq .owner|strip

print "leave group"
delete "/group/${group}" $header_2
last|jq .status|strip

print "delete group"
delete "/group/${group}" $header_1
last

print "create new group (user 1)"
post "/group" $header_1 '{"name":"dennis_second"}'
group=`last|jq .id|strip`
group_name=`last|jq .name|strip`
group_start_sum=`last|jq .startSum`

print "join new group (user 2)"
put "/group/${group}" $header_2
last|jq -c '.users | map(.id)'

print "join new group (user 3)"
put "/group/${group}" $header_3
last|jq -c '.users | map(.id)'

print "join new group (user 4)"
put "/group/${group}" $header_4
last|jq -c '.users | map(.id)'

user_3=`last|jq .users[2].id|strip`
user_4=`last|jq .users[3].id|strip`

new_order="$(echo $(cat <<-EOF
{
 "0": "${user_2}",
 "1": "${user_3}",
 "2": "${user_4}",
 "3": "${user_1}"
}
EOF
))"

print "change order ($new_order)"
post "/group/${group}/order" $header_1 "$new_order"
last

last|jq -c '.users | map(.id)'

print "update name (was: ${group_name})"
patch "/group/${group}" $header_1 '{"name":"foo-bar-club"}'
last|jq .name|strip

print "update start sum (was: ${group_start_sum})"
patch "/group/${group}" $header_1 '{"startSum":50}'
last|jq -c '.users[0].sum'

print "start"
post "/group/${group}/start" $header_1
action_id=`last|jq .action|strip`
echo $action_id

##
##
print "hand #1"
echo "betting round"
post "/action/${action_id}/${group}" $header_2 '{"type":"raise","value":40}' # stored
post "/action/${action_id}/${group}" $header_3 '{"type":"bet"}' # small | button
post "/action/${action_id}/${group}" $header_4 '{"type":"bet"}'
post "/action/${action_id}/${group}" $header_1 '{"type":"bet"}'
post "/action/${action_id}/${group}" $header_2 '{"type":"call"}'
echo "end betting round (all stay, pot at 20)"

echo "round 1"
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}' # button
post "/action/${action_id}/${group}" $header_4 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_1 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_2 '{"type":"check"}'
echo "end round 1 (all stay, pot stays the same)"

echo "round 2"
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_4 '{"type":"raise","value":10}' # new button
post "/action/${action_id}/${group}" $header_1 '{"type":"fold"}'
post "/action/${action_id}/${group}" $header_2 '{"type":"call"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"call"}'
echo "end round 2 (user 1 should fold, pot at 50)"

echo "round 3"
post "/action/${action_id}/${group}" $header_4 '{"type":"check"}' # button
post "/action/${action_id}/${group}" $header_2 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}'
echo "end round 3 (3 users remaing, pot unchanged)"

echo "showdown draw"
post "/action/${action_id}/${group}" $header_1 '{"type":"draw"}'
echo "end game (pot divided in 3 (16 each, 2 stored to next))"

##
##
print "hand #2"
echo "betting round"
post "/action/${action_id}/${group}" $header_4 '{"type":"raise","value":39}' # small | button
post "/action/${action_id}/${group}" $header_1 '{"type":"bet"}'
post "/action/${action_id}/${group}" $header_2 '{"type":"fold"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"fold"}'
post "/action/${action_id}/${group}" $header_4 '{"type":"fold"}' # user 4 forfeits (was small (edge case))
echo "end betting round (all folded, user 1 gets small + stored (4))"

##
##
print "hand #3"
echo "betting round"
post "/action/${action_id}/${group}" $header_1 '{"type":"raise","value":1}' # small | button
post "/action/${action_id}/${group}" $header_2 '{"type":"call"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"call"}'
post "/action/${action_id}/${group}" $header_4 '{"type":"call"}'
echo "end betting round (all stay, pot at 18)"

echo "round 1"
post "/action/${action_id}/${group}" $header_1 '{"type":"check"}' # small | button
post "/action/${action_id}/${group}" $header_2 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_4 '{"type":"allIn"}'
post "/action/${action_id}/${group}" $header_1 '{"type":"raise","value":50}'
post "/action/${action_id}/${group}" $header_2 '{"type":"fold"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"allIn"}'
echo "end round 1, two went all in, 1 folded and one continued"

post "/action/${action_id}/${group}" $header_1 "$(echo $(cat <<-EOF
{
 "type": "winner",
 "order": [["${user_4}"],["${user_1}"],["${user_3}"]]
}
EOF
))"


##
##
print "hand #4"
echo "round 1"
post "/action/${action_id}/${group}" $header_2 '{"type":"raise","value":5}' # small | button
post "/action/${action_id}/${group}" $header_3 '{"type":"raise","value":5}'
post "/action/${action_id}/${group}" $header_4 '{"type":"raise","value":5}'
post "/action/${action_id}/${group}" $header_1 '{"type":"raise","value":5}'
post "/action/${action_id}/${group}" $header_2 '{"type":"call"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"call"}'
post "/action/${action_id}/${group}" $header_4 '{"type":"allIn"}'
echo "end round 1, all raised 5, one folde (pot at 95)"

echo "round 2"
post "/action/${action_id}/${group}" $header_1 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_2 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}'
echo "end round 2, nothing changed"

echo "round 3"
post "/action/${action_id}/${group}" $header_1 '{"type":"raise","value":25}'
post "/action/${action_id}/${group}" $header_2 '{"type":"allIn"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"call"}'
echo "end round 3, pot at 141"

echo "round 4"
post "/action/${action_id}/${group}" $header_1 '{"type":"check"}'
post "/action/${action_id}/${group}" $header_3 '{"type":"check"}'
echo "nothing changed, at showdown"

# post "/action/${action_id}/${group}" $header_1 "$(echo $(cat <<-EOF
# {
#  "type": "winner",
#  "order": [["${user_3}", "${user_1}"],["${user_2}"],["${user_4}"]]
# }
# EOF
# ))"
# echo "only user 3 & 1 should be left"

# ##
# ##
# print "hand #5"
# echo "round 1"
# post "/action/${action_id}/${group}" $header_3 '{"type":"allIn"}'
# post "/action/${action_id}/${group}" $header_1 '{"type":"call"}'
# echo "end of hand #5"

# post "/action/${action_id}/${group}" $header_1 "$(echo $(cat <<-EOF
# {
#  "type": "winner",
#  "order": [["${user_1}"],["${user_3}"]]
# }
# EOF
# ))"
# echo "only user 1 should be left"
