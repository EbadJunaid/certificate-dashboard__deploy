from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient, errors
from datetime import datetime, timedelta
import random
from typing import List, Dict, Any

app = FastAPI(title="Certificate Analytics API", description="API for certificate analytics dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "my-pk-domains-multi"


try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info()  # Force connection on a request as the
                          # connect=True parameter of MongoClient seems
                          # to be deprecated
    db = client[DB_NAME]
    certificates_collection = db["certificates"]
except errors.ServerSelectionTimeoutError as err:
    raise RuntimeError("Could not connect to MongoDB: " + str(err))

@app.get("/")
def read_root():
    return {"message": "Certificate Analytics API", "version": "1.0"}

# New debug endpoint to fetch and return the first few documents
@app.get("/api/debug/first_docs")
def get_first_docs(limit: int = 5):
    """
    Debug endpoint to return the first N documents from the collection.
    Use this to verify the collection contents and structure.
    """
    docs = list(certificates_collection.find({}, {"_id": 0}).limit(limit))
    total_count = certificates_collection.count_documents({})
    return {
        "db_name": DB_NAME,
        "collection_name": "certificates",
        "total_documents": total_count,
        "first_docs": docs
    }

@app.get("/api/overview")
def get_overview():
    now = datetime.utcnow().isoformat()
    soon = (datetime.utcnow() + timedelta(days=30)).isoformat()

    total = certificates_collection.count_documents({})
    active = certificates_collection.count_documents({"parsed.validity.end": {"$gt": now}})
    expired = certificates_collection.count_documents({"parsed.validity.end": {"$lt": now}})
    expiring_soon = certificates_collection.count_documents({"parsed.validity.end": {"$gt": now, "$lt": soon}})

    types = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.signature_algorithm.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))

    issuers = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.issuer.common_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))

    return {
        "total": total,
        "active": active,
        "expired": expired,
        "expiring_soon": expiring_soon,
        "types": types,
        "issuers": issuers
    }

@app.get("/api/certificates")
def get_certificates():
    certs = list(certificates_collection.find({}, {"_id": 0}))
    for cert in certs:
        cert["issue_date"] = cert.get("parsed", {}).get("validity", {}).get("start")
        cert["expiry_date"] = cert.get("parsed", {}).get("validity", {}).get("end")
    return certs

@app.get("/api/certificates/active")
def get_active_certificates():
    now = datetime.utcnow().isoformat()
    certs = list(certificates_collection.find({"parsed.validity.end": {"$gt": now}}, {"_id": 0}))
    return certs

@app.get("/api/certificates/expired")
def get_expired_certificates():
    now = datetime.utcnow().isoformat()
    certs = list(certificates_collection.find({"parsed.validity.end": {"$lt": now}}, {"_id": 0}))
    return certs

@app.get("/api/types")
def get_certificate_types():
    types = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.signature_algorithm.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"types": types}

@app.get("/api/timeline")
def get_issuance_timeline():

    try:
        # Fetch only the start dates to limit bandwidth
        cursor = certificates_collection.find(
            {"parsed.validity.start": {"$exists": True}},
            {"_id": 0, "parsed.validity.start": 1}
        )

        counts = {}
        for doc in cursor:
            start = doc.get("parsed", {}).get("validity", {}).get("start")
            if not start:
                continue
            # Normalize common ISO format with trailing Z
            try:
                dt = datetime.fromisoformat(start.replace("Z", ""))
            except Exception:
                # Skip malformed date strings
                continue

            key = (dt.year, dt.month)
            counts[key] = counts.get(key, 0) + 1

        # Build sorted timeline list
        timeline = [
            {"date": f"{year}-{month:02d}-01", "count": counts[(year, month)]}
            for (year, month) in sorted(counts.keys())
        ]

        return {"timeline": timeline}
    except Exception as e:
        # Provide a clearer error message in the response for debugging
        raise HTTPException(status_code=500, detail=f"Error building timeline: {e}")

@app.get("/api/issuers")
def get_top_issuers():
    issuers = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.issuer.common_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"issuers": issuers}

@app.get("/api/expiring")
def get_expiring_certificates():
    now = datetime.utcnow().isoformat()
    soon = (datetime.utcnow() + timedelta(days=30)).isoformat()
    certs = list(certificates_collection.find({"parsed.validity.end": {"$gt": now, "$lt": soon}}, {"_id": 0}))
    for cert in certs:
        expiry = cert.get("parsed", {}).get("validity", {}).get("end")
        if expiry:
            cert["days_remaining"] = (datetime.fromisoformat(expiry.replace("Z", "")) - datetime.utcnow()).days
    return {"expiring": certs}

@app.get("/api/regions")
def get_region_breakdown():
    regions = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.issuer.country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"regions": regions}

@app.get("/api/departments")
def get_department_distribution():
    departments = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.issuer.organization", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"departments": departments}

# Mock ML Endpoints
@app.get("/api/ml/predict-expiry")
def predict_expiry():
    """Mock endpoint that simulates ML predictions for certificate expiry risk"""
    # Get active certificates
    active_certs = list(certificates_collection.find({"status": "Active"}, {"_id": 0}))
    predictions = []
    
    for cert in active_certs:
        # Convert datetime objects for JSON serialization
        cert["issue_date"] = cert["issue_date"].isoformat()
        cert["expiry_date"] = cert["expiry_date"].isoformat()
        
        # Mock risk calculation based on various factors
        days_until_expiry = (datetime.fromisoformat(cert["expiry_date"]) - datetime.now()).days
        auto_renewal_factor = 0.3 if cert["auto_renewal"] else 0.7
        
        # Risk calculation combines days until expiry, key strength, auto-renewal status
        risk_score = min(10, max(0, 
            (1.0 - (days_until_expiry / 365)) * 7 +  # Time factor
            (1.0 - (cert["key_strength"] / 4096)) * 1.5 +  # Key strength factor
            auto_renewal_factor +  # Auto-renewal factor
            random.uniform(-1, 1)  # Add some randomness
        ))
        
        predictions.append({
            "certificate_id": cert["certificate_id"],
            "name": cert["name"],
            "expiry_date": cert["expiry_date"],
            "days_remaining": days_until_expiry,
            "risk_score": round(risk_score, 1),
            "risk_category": "High" if risk_score > 7 else "Medium" if risk_score > 4 else "Low",
            "recommendations": get_mock_recommendations(risk_score, cert)
        })
    
    # Sort by risk score (highest first)
    predictions.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"predictions": predictions}

@app.get("/api/ml/anomalies")
def detect_anomalies():
    """Mock endpoint that simulates ML anomaly detection"""
    certificates = list(certificates_collection.find({}, {"_id": 0}))
    anomalies = []
    
    # Simulate finding a few anomalies
    for i in range(min(5, len(certificates))):
        cert = random.choice(certificates)
        cert["issue_date"] = cert["issue_date"].isoformat()
        cert["expiry_date"] = cert["expiry_date"].isoformat()
        
        anomaly_type = random.choice([
            "Unusually short validity period",
            "Abnormal key strength for certificate type",
            "Inconsistent with department policy",
            "Unusual issuer for this department",
            "Certificate renewed too early",
            "Duplicate certificate detected"
        ])
        
        confidence = round(random.uniform(0.65, 0.98), 2)
        
        anomalies.append({
            "certificate_id": cert["certificate_id"],
            "name": cert["name"],
            "type": cert["type"],
            "department": cert["department"],
            "anomaly_type": anomaly_type,
            "confidence": confidence,
            "recommendation": get_anomaly_recommendation(anomaly_type, cert)
        })
    
    # Sort by confidence (highest first)
    anomalies.sort(key=lambda x: x["confidence"], reverse=True)
    return {"anomalies": anomalies}

# Helper functions for mock recommendations
def get_mock_recommendations(risk_score, cert):
    recommendations = []
    
    if risk_score > 7:
        recommendations.append("Immediate action required: Certificate expiring soon")
        recommendations.append("Schedule renewal within the next 7 days")
    elif risk_score > 4:
        recommendations.append("Monitor closely: Certificate has moderate expiry risk")
        recommendations.append("Plan for renewal in the coming weeks")
    else:
        recommendations.append("Low risk: Certificate in good standing")
    
    if not cert["auto_renewal"]:
        recommendations.append("Enable auto-renewal to reduce future risk")
    
    if cert["key_strength"] < 3072:
        recommendations.append("Consider upgrading key strength on next renewal")
    
    return recommendations

def get_anomaly_recommendation(anomaly_type, cert):
    if anomaly_type == "Unusually short validity period":
        return "Review certificate policy and consider extending validity period"
    elif anomaly_type == "Abnormal key strength for certificate type":
        return "Adjust key strength to match department standards"
    elif anomaly_type == "Inconsistent with department policy":
        return "Review department certificate policy compliance"
    elif anomaly_type == "Unusual issuer for this department":
        return "Verify if certificate issuer is approved for this department"
    elif anomaly_type == "Certificate renewed too early":
        return "Optimize renewal timing to maximize certificate lifespan"
    elif anomaly_type == "Duplicate certificate detected":
        return "Review and consolidate duplicate certificates"
    else:
        return "Investigate anomaly and take appropriate action"

@app.get("/api/validity-distribution")
def get_validity_distribution():
    """Endpoint that returns the distribution of certificate validity periods"""
    valid_periods = list(certificates_collection.aggregate([
        {
            "$project": {
                "validity_days": {
                    "$divide": [
                        {"$subtract": [
                            {"$toDate": "$parsed.validity.end"},
                            {"$toDate": "$parsed.validity.start"}
                        ]},
                        1000 * 60 * 60 * 24  # Convert milliseconds to days
                    ]
                }
            }
        },
        {
            "$bucket": {
                "groupBy": "$validity_days",
                "boundaries": [0, 30, 90, 180, 365, 730, 1095, 1825, 3650],
                "default": "3650+",
                "output": {
                    "count": {"$sum": 1}
                }
            }
        }
    ]))
    
    return {
        "validity_periods": [
            {"range": "< 30 days", "count": next((item["count"] for item in valid_periods if item["_id"] == 0), 0)},
            {"range": "30-90 days", "count": next((item["count"] for item in valid_periods if item["_id"] == 30), 0)},
            {"range": "90-180 days", "count": next((item["count"] for item in valid_periods if item["_id"] == 90), 0)},
            {"range": "180-365 days", "count": next((item["count"] for item in valid_periods if item["_id"] == 180), 0)},
            {"range": "1-2 years", "count": next((item["count"] for item in valid_periods if item["_id"] == 365), 0)},
            {"range": "2-3 years", "count": next((item["count"] for item in valid_periods if item["_id"] == 730), 0)},
            {"range": "3-5 years", "count": next((item["count"] for item in valid_periods if item["_id"] == 1095), 0)},
            {"range": "5-10 years", "count": next((item["count"] for item in valid_periods if item["_id"] == 1825), 0)},
            {"range": "> 10 years", "count": next((item["count"] for item in valid_periods if item["_id"] == "3650+"), 0)}
        ]
    }

@app.get("/api/hash-algorithms")
def get_hash_algorithms():
    """Endpoint that returns the distribution of hash algorithms used in certificates"""
    hash_algorithms = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.signature_algorithm.hash_algorithm", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"hash_algorithms": hash_algorithms}

@app.get("/api/signature-algorithms")
def get_signature_algorithms():
    """Endpoint that returns the distribution of signature algorithms used in certificates"""
    sig_algorithms = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.signature_algorithm.name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"signature_algorithms": sig_algorithms}

@app.get("/api/certificate-authorities")
def get_certificate_authorities():
    """Endpoint that returns the distribution of root certificate authorities"""
    cas = list(certificates_collection.aggregate([
        {"$group": {"_id": "$parsed.issuer.common_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    return {"certificate_authorities": cas}

@app.get("/api/intermediate-cas")
def get_intermediate_cas():
    """Endpoint that returns the distribution of intermediate certificate authorities"""
    try:
        intermediate_cas = list(certificates_collection.aggregate([
            {
                "$match": {
                    "$and": [
                        {"parsed.issuer.common_name": {"$exists": True}},
                        {"parsed.subject.common_name": {"$exists": True}},
                        {"$expr": {"$ne": ["$parsed.issuer.common_name", "$parsed.subject.common_name"]}}
                    ]
                }
            },
            {"$group": {"_id": "$parsed.subject.common_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))

        return {"intermediate_cas": intermediate_cas}

    except Exception as e:
        print("❌ Error:", e)
        raise HTTPException(status_code=500, detail=f"Error computing intermediate CAs: {e}")


@app.get("/api/san-distribution")
def get_san_distribution():
    """Endpoint that returns the distribution of Subject Alternative Names (SAN) counts"""
    san_counts = list(certificates_collection.aggregate([
        {
            "$project": {
                "san_count": {"$size": {"$ifNull": ["$parsed.extensions.subject_alt_name.dns_names", []]}}
            }
        },
        {
            "$bucket": {
                "groupBy": "$san_count",
                "boundaries": [0, 1, 2, 3, 5, 10, 20, 50, 100],
                "default": "100+",
                "output": {
                    "count": {"$sum": 1}
                }
            }
        }
    ]))
    
    return {
        "san_distribution": [
            {"range": "0", "count": next((item["count"] for item in san_counts if item["_id"] == 0), 0)},
            {"range": "1", "count": next((item["count"] for item in san_counts if item["_id"] == 1), 0)},
            {"range": "2-3", "count": next((item["count"] for item in san_counts if item["_id"] == 2), 0)},
            {"range": "4-5", "count": next((item["count"] for item in san_counts if item["_id"] == 3), 0)},
            {"range": "5-10", "count": next((item["count"] for item in san_counts if item["_id"] == 5), 0)},
            {"range": "10-20", "count": next((item["count"] for item in san_counts if item["_id"] == 10), 0)},
            {"range": "20-50", "count": next((item["count"] for item in san_counts if item["_id"] == 20), 0)},
            {"range": "50-100", "count": next((item["count"] for item in san_counts if item["_id"] == 50), 0)},
            {"range": "> 100", "count": next((item["count"] for item in san_counts if item["_id"] == "100+"), 0)}
        ]
    }

@app.get("/api/san-domains")
def get_san_domains():
    """Endpoint that returns the most common domains in Subject Alternative Names"""
    pipeline = [
        {"$unwind": {"path": "$parsed.extensions.subject_alt_name.dns_names", "preserveNullAndEmptyArrays": False}},
        {"$group": {"_id": "$parsed.extensions.subject_alt_name.dns_names", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]
    domains = list(certificates_collection.aggregate(pipeline))
    return {"san_domains": domains}

@app.get("/api/validity-trends")
def get_validity_trends():
    """Endpoint that returns validity period trends over time"""
    trends = list(certificates_collection.aggregate([
        {
            "$project": {
                "year_issued": {"$year": {"$toDate": "$parsed.validity.start"}},
                "validity_days": {
                    "$divide": [
                        {"$subtract": [
                            {"$toDate": "$parsed.validity.end"},
                            {"$toDate": "$parsed.validity.start"}
                        ]},
                        1000 * 60 * 60 * 24  # Convert milliseconds to days
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": "$year_issued",
                "avg_validity": {"$avg": "$validity_days"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]))
    
    return {"validity_trends": trends}


@app.get("/api/algorithm-trends")
def get_algorithm_trends():
    """Endpoint that returns algorithm usage trends over time"""
    try:
        # Fetch only the fields we need
        cursor = certificates_collection.find(
            {
                "parsed.validity.start": {"$exists": True},
                "parsed.signature_algorithm.name": {"$exists": True}
            },
            {
                "_id": 0,
                "parsed.validity.start": 1,
                "parsed.signature_algorithm.name": 1
            }
        )

        # Count occurrences of (year, algorithm)
        trends = {}
        for doc in cursor:
            start = doc.get("parsed", {}).get("validity", {}).get("start")
            algorithm = doc.get("parsed", {}).get("signature_algorithm", {}).get("name")

            if not start or not algorithm:
                continue

            # Parse the date safely
            try:
                dt = datetime.fromisoformat(start.replace("Z", ""))
            except Exception:
                continue  # skip malformed dates

            key = (dt.year, algorithm)
            trends[key] = trends.get(key, 0) + 1

        # Restructure data for frontend
        result = {}
        for (year, algorithm), count in trends.items():
            if year not in result:
                result[year] = []
            result[year].append({"algorithm": algorithm, "count": count})

        # Sort by year for cleaner output
        sorted_result = sorted(result.items())

        return {
            "algorithm_trends": [
                {"year": year, "algorithms": algos} for year, algos in sorted_result
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing algorithm trends: {e}")



@app.get("/api/issuer-organization")
def get_issuer_organization():
    """Endpoint that returns the distribution of issuer organizations"""
    pipeline = [
        {"$unwind": {"path": "$parsed.issuer.organization", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$parsed.issuer.organization", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    organizations = list(certificates_collection.aggregate(pipeline))
    return {"issuer_organizations": organizations}

@app.get("/api/issuer-country")
def get_issuer_country():
    """Endpoint that returns the distribution of issuer countries"""
    pipeline = [
        {"$unwind": {"path": "$parsed.issuer.country", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$parsed.issuer.country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    countries = list(certificates_collection.aggregate(pipeline))
    return {"issuer_countries": countries}

@app.get("/api/subject-common-names")
def get_subject_common_names():
    """Endpoint that returns the distribution of subject common names (owners)"""
    pipeline = [
        {"$unwind": {"path": "$parsed.subject.common_name", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$parsed.subject.common_name", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 50}  # Limit to top 50 to avoid overwhelming response
    ]
    common_names = list(certificates_collection.aggregate(pipeline))
    return {"subject_common_names": common_names}

@app.get("/api/ca-domain-analysis")
def get_ca_domain_analysis():
    """Endpoint that returns analysis of CAs vs Domain Names"""
    pipeline = [
        {"$unwind": {"path": "$parsed.issuer.organization", "preserveNullAndEmptyArrays": True}},
        {"$unwind": {"path": "$parsed.extensions.subject_alt_name.dns_names", "preserveNullAndEmptyArrays": True}},
        {
            "$group": {
                "_id": {
                    "ca": "$parsed.issuer.organization",
                    "domain": {"$arrayElemAt": [{"$split": ["$parsed.extensions.subject_alt_name.dns_names", "."]}, -2]}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {
            "$group": {
                "_id": "$_id.ca",
                "domains": {
                    "$push": {
                        "domain": "$_id.domain",
                        "count": "$count"
                    }
                },
                "total": {"$sum": "$count"}
            }
        },
        {"$sort": {"total": -1}}
    ]
    ca_domains = list(certificates_collection.aggregate(pipeline))
    return {"ca_domains": ca_domains}


@app.get("/api/ca-url-analysis")
def get_ca_url_analysis():
    """Endpoint that returns analysis of CAs vs URLs"""
    try:
        # Only fetch the fields we actually need
        cursor = certificates_collection.find(
            {
                "parsed.extensions.subject_alt_name.dns_names": {"$exists": True},
                "parsed.issuer.organization": {"$exists": True}
            },
            {
                "_id": 0,
                "parsed.issuer.organization": 1,
                "parsed.extensions.subject_alt_name.dns_names": 1
            }
        )

        ca_stats = {}

        for doc in cursor:
            # Extract CA organization name
            issuer_org = doc.get("parsed", {}).get("issuer", {}).get("organization")

            # Handle cases where organization is a list or string
            if isinstance(issuer_org, list):
                orgs = issuer_org
            elif isinstance(issuer_org, str):
                orgs = [issuer_org]
            else:
                continue  # skip if malformed

            # Extract list of URLs (DNS names)
            dns_names = (
                doc.get("parsed", {})
                   .get("extensions", {})
                   .get("subject_alt_name", {})
                   .get("dns_names", [])
            )

            url_count = len(dns_names)

            # Update counts for each CA organization
            for org in orgs:
                if not org:
                    continue
                if org not in ca_stats:
                    ca_stats[org] = {"url_count": 0, "cert_count": 0}

                ca_stats[org]["url_count"] += url_count
                ca_stats[org]["cert_count"] += 1

        # Compute averages and build response
        result = []
        for ca, stats in ca_stats.items():
            avg_urls = (
                stats["url_count"] / stats["cert_count"]
                if stats["cert_count"] > 0 else 0
            )
            result.append({
                "ca": ca,
                "url_count": stats["url_count"],
                "cert_count": stats["cert_count"],
                "avg_urls_per_cert": avg_urls
            })

        # Sort by URL count descending
        result.sort(key=lambda x: x["url_count"], reverse=True)

        return {"ca_urls": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing CA-URL analysis: {e}")





@app.get("/api/ca-pubkey-analysis")
def get_ca_pubkey_analysis():
    """Endpoint that returns analysis of CAs vs Public Keys (looking for duplications)"""
    pipeline = [
        {"$unwind": {"path": "$parsed.issuer.organization", "preserveNullAndEmptyArrays": True}},
        {
            "$group": {
                "_id": {
                    "ca": "$parsed.issuer.organization",
                    "pubkey_fingerprint": "$parsed.subject_key_info.fingerprint_sha256"
                },
                "count": {"$sum": 1},
                "domains": {"$push": {"$arrayElemAt": ["$parsed.subject.common_name", 0]}},
            }
        },
        {"$match": {"count": {"$gt": 1}}},  # Only include duplicated keys
        {"$sort": {"count": -1}},
        {
            "$group": {
                "_id": "$_id.ca",
                "duplicated_keys": {
                    "$push": {
                        "pubkey_fingerprint": "$_id.pubkey_fingerprint",
                        "count": "$count",
                        "sample_domains": {"$slice": ["$domains", 5]}
                    }
                },
                "total_duplications": {"$sum": 1}
            }
        },
        {"$sort": {"total_duplications": -1}}
    ]
    ca_pubkeys = list(certificates_collection.aggregate(pipeline))
    return {"ca_pubkeys": ca_pubkeys}

@app.get("/api/shared-pubkeys")
def get_shared_pubkeys():
    """Endpoint that returns analysis of shared public keys across certificates"""
    pipeline = [
        {
            "$group": {
                "_id": "$parsed.subject_key_info.fingerprint_sha256",
                "count": {"$sum": 1},
                "issuers": {"$addToSet": {"$arrayElemAt": ["$parsed.issuer.organization", 0]}},
                "domains": {"$addToSet": {"$arrayElemAt": ["$parsed.subject.common_name", 0]}},
                "certificates": {"$push": {
                    "serial_number": "$parsed.serial_number",
                    "issuer": {"$arrayElemAt": ["$parsed.issuer.organization", 0]},
                    "subject": {"$arrayElemAt": ["$parsed.subject.common_name", 0]},
                    "validity_start": "$parsed.validity.start",
                    "validity_end": "$parsed.validity.end"
                }}
            }
        },
        {"$match": {"count": {"$gt": 1}}},  # Only include shared keys
        {"$sort": {"count": -1}},
        {"$limit": 100}  # Limit to top 100 to avoid overwhelming response
    ]
    shared_pubkeys = list(certificates_collection.aggregate(pipeline))
    return {"shared_pubkeys": shared_pubkeys}

# Shutdown MongoDB connection on app shutdown
@app.on_event("shutdown")
def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)