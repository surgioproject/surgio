#!name=MitM All Hostnames
#!desc=Perform MitM on all hostnames with port 443, except those to Apple and other common sites which can't be inspected. You still need configure CA certificate and enable the main switch of MitM.
#{{ downloadUrl }}

[MITM]
hostname = -*.apple.com, -*.icloud.com, -*.mzstatic.com, -*.crashlytics.com, -*.facebook.com, -*.instagram.com, *
