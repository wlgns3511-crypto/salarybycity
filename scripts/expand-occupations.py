"""
Incrementally expand salary data by fetching more occupations.
Saves progress and resumes from where it left off each day.

Run daily until all occupations are fetched:
  python3 scripts/expand-occupations.py --key=YOUR_BLS_KEY

Progress is saved in data/fetch_progress.json
"""

import json
import os
import sys
import time
import sqlite3
import re
import urllib.request

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
DB_PATH = os.path.join(DATA_DIR, 'salary.db')
PROGRESS_FILE = os.path.join(DATA_DIR, 'fetch_progress.json')
API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/'

API_KEY = ''
for arg in sys.argv:
    if arg.startswith('--key='):
        API_KEY = arg.split('=', 1)[1]

if not API_KEY:
    API_KEY = os.environ.get('BLS_API_KEY', '')

if not API_KEY:
    print('ERROR: Provide BLS API key with --key=YOUR_KEY')
    sys.exit(1)

MAX_SERIES = 50
MAX_QUERIES = 490  # Leave some margin

# All 23 major SOC groups with detailed occupations
# Full list from BLS OES
ALL_OCCUPATIONS = [
    # Management (11)
    ("11-1011", "Chief Executives"),
    ("11-1021", "General and Operations Managers"),
    ("11-1031", "Legislators"),
    ("11-2021", "Marketing Managers"),
    ("11-2022", "Sales Managers"),
    ("11-2031", "Public Relations and Fundraising Managers"),
    ("11-3011", "Administrative Services Managers"),
    ("11-3013", "Facilities Managers"),
    ("11-3021", "Computer and Information Systems Managers"),
    ("11-3031", "Financial Managers"),
    ("11-3051", "Industrial Production Managers"),
    ("11-3061", "Purchasing Managers"),
    ("11-3071", "Transportation, Storage, and Distribution Managers"),
    ("11-3111", "Compensation and Benefits Managers"),
    ("11-3121", "Human Resources Managers"),
    ("11-3131", "Training and Development Managers"),
    ("11-9013", "Farmers, Ranchers, and Other Agricultural Managers"),
    ("11-9021", "Construction Managers"),
    ("11-9031", "Education and Childcare Administrators, Preschool and Daycare"),
    ("11-9032", "Education Administrators, Kindergarten through Secondary"),
    ("11-9033", "Education Administrators, Postsecondary"),
    ("11-9041", "Architectural and Engineering Managers"),
    ("11-9051", "Food Service Managers"),
    ("11-9071", "Gambling Managers"),
    ("11-9081", "Lodging Managers"),
    ("11-9111", "Medical and Health Services Managers"),
    ("11-9121", "Natural Sciences Managers"),
    ("11-9131", "Postmasters and Mail Superintendents"),
    ("11-9151", "Social and Community Service Managers"),
    ("11-9161", "Emergency Management Directors"),
    ("11-9198", "Personal Service Managers, All Other"),
    ("11-9199", "Managers, All Other"),
    # Business and Financial (13)
    ("13-1011", "Agents and Business Managers of Artists, Performers, and Athletes"),
    ("13-1020", "Buyers and Purchasing Agents"),
    ("13-1031", "Claims Adjusters, Examiners, and Investigators"),
    ("13-1041", "Compliance Officers"),
    ("13-1051", "Cost Estimators"),
    ("13-1071", "Human Resources Specialists"),
    ("13-1074", "Farm Labor Contractors"),
    ("13-1075", "Labor Relations Specialists"),
    ("13-1081", "Logisticians"),
    ("13-1082", "Project Management Specialists"),
    ("13-1111", "Management Analysts"),
    ("13-1121", "Meeting, Convention, and Event Planners"),
    ("13-1131", "Fundraisers"),
    ("13-1141", "Compensation, Benefits, and Job Analysis Specialists"),
    ("13-1151", "Training and Development Specialists"),
    ("13-1161", "Market Research Analysts and Marketing Specialists"),
    ("13-1199", "Business Operations Specialists, All Other"),
    ("13-2011", "Accountants and Auditors"),
    ("13-2020", "Property Appraisers and Assessors"),
    ("13-2031", "Budget Analysts"),
    ("13-2041", "Credit Analysts"),
    ("13-2051", "Financial and Investment Analysts"),
    ("13-2052", "Personal Financial Advisors"),
    ("13-2053", "Insurance Underwriters"),
    ("13-2054", "Financial Risk Specialists"),
    ("13-2061", "Financial Examiners"),
    ("13-2072", "Loan Officers"),
    ("13-2081", "Tax Examiners and Collectors, and Revenue Agents"),
    ("13-2082", "Tax Preparers"),
    ("13-2099", "Financial Specialists, All Other"),
    # Computer and Mathematical (15)
    ("15-1211", "Computer Systems Analysts"),
    ("15-1212", "Information Security Analysts"),
    ("15-1221", "Computer and Information Research Scientists"),
    ("15-1231", "Computer Network Support Specialists"),
    ("15-1232", "Computer User Support Specialists"),
    ("15-1241", "Computer Network Architects"),
    ("15-1242", "Database Administrators"),
    ("15-1243", "Database Architects"),
    ("15-1244", "Network and Computer Systems Administrators"),
    ("15-1251", "Computer Programmers"),
    ("15-1252", "Software Developers"),
    ("15-1253", "Software Quality Assurance Analysts and Testers"),
    ("15-1254", "Web Developers"),
    ("15-1255", "Web and Digital Interface Designers"),
    ("15-1299", "Computer Occupations, All Other"),
    ("15-2011", "Actuaries"),
    ("15-2021", "Mathematicians"),
    ("15-2031", "Operations Research Analysts"),
    ("15-2041", "Statisticians"),
    ("15-2051", "Data Scientists"),
    ("15-2099", "Mathematical Science Occupations, All Other"),
    # Architecture and Engineering (17)
    ("17-1011", "Architects, Except Landscape and Naval"),
    ("17-1012", "Landscape Architects"),
    ("17-1022", "Surveyors"),
    ("17-2011", "Aerospace Engineers"),
    ("17-2021", "Agricultural Engineers"),
    ("17-2031", "Bioengineers and Biomedical Engineers"),
    ("17-2041", "Chemical Engineers"),
    ("17-2051", "Civil Engineers"),
    ("17-2061", "Computer Hardware Engineers"),
    ("17-2071", "Electrical Engineers"),
    ("17-2072", "Electronics Engineers, Except Computer"),
    ("17-2081", "Environmental Engineers"),
    ("17-2111", "Health and Safety Engineers, Except Mining Safety Engineers and Inspectors"),
    ("17-2112", "Industrial Engineers"),
    ("17-2121", "Marine Engineers and Naval Architects"),
    ("17-2131", "Materials Engineers"),
    ("17-2141", "Mechanical Engineers"),
    ("17-2151", "Mining and Geological Engineers, Including Mining Safety Engineers"),
    ("17-2161", "Nuclear Engineers"),
    ("17-2171", "Petroleum Engineers"),
    ("17-2199", "Engineers, All Other"),
    ("17-3011", "Architectural and Civil Drafters"),
    ("17-3013", "Mechanical Drafters"),
    ("17-3021", "Aerospace Engineering and Operations Technologists and Technicians"),
    ("17-3022", "Civil Engineering Technologists and Technicians"),
    ("17-3023", "Electrical and Electronic Engineering Technologists and Technicians"),
    ("17-3024", "Electro-Mechanical and Mechatronics Technologists and Technicians"),
    ("17-3025", "Environmental Engineering Technologists and Technicians"),
    ("17-3026", "Industrial Engineering Technologists and Technicians"),
    ("17-3027", "Mechanical Engineering Technologists and Technicians"),
    ("17-3031", "Surveying and Mapping Technicians"),
    # Life, Physical, Social Science (19)
    ("19-1011", "Animal Scientists"),
    ("19-1012", "Food Scientists and Technologists"),
    ("19-1013", "Soil and Plant Scientists"),
    ("19-1021", "Biochemists and Biophysicists"),
    ("19-1022", "Microbiologists"),
    ("19-1023", "Zoologists and Wildlife Biologists"),
    ("19-1029", "Biological Scientists, All Other"),
    ("19-1042", "Medical Scientists, Except Epidemiologists"),
    ("19-2012", "Physicists"),
    ("19-2021", "Atmospheric and Space Scientists"),
    ("19-2031", "Chemists"),
    ("19-2041", "Environmental Scientists and Specialists, Including Health"),
    ("19-2042", "Geoscientists, Except Hydrologists and Geographers"),
    ("19-3011", "Economists"),
    ("19-3022", "Survey Researchers"),
    ("19-3032", "Industrial-Organizational Psychologists"),
    ("19-3034", "School Psychologists"),
    ("19-3039", "Psychologists, All Other"),
    ("19-3041", "Sociologists"),
    ("19-3051", "Urban and Regional Planners"),
    ("19-3091", "Anthropologists and Archeologists"),
    ("19-4012", "Agricultural Technicians"),
    ("19-4021", "Biological Technicians"),
    ("19-4031", "Chemical Technicians"),
    ("19-4042", "Environmental Science and Protection Technicians, Including Health"),
    ("19-4051", "Nuclear Technicians"),
    # Community and Social Service (21)
    ("21-1011", "Substance Abuse and Behavioral Disorder Counselors"),
    ("21-1012", "Educational, Guidance, and Career Counselors and Advisors"),
    ("21-1013", "Marriage and Family Therapists"),
    ("21-1014", "Mental Health Counselors"),
    ("21-1015", "Rehabilitation Counselors"),
    ("21-1018", "Substance Abuse, Behavioral Disorder, and Mental Health Counselors"),
    ("21-1021", "Child, Family, and School Social Workers"),
    ("21-1022", "Healthcare Social Workers"),
    ("21-1023", "Mental Health and Substance Abuse Social Workers"),
    ("21-1029", "Social Workers, All Other"),
    ("21-1091", "Health Education Specialists"),
    ("21-1092", "Probation Officers and Correctional Treatment Specialists"),
    ("21-1093", "Social and Human Service Assistants"),
    ("21-1094", "Community Health Workers"),
    ("21-2011", "Clergy"),
    ("21-2021", "Directors, Religious Activities and Education"),
    # Legal (23)
    ("23-1011", "Lawyers"),
    ("23-1012", "Judicial Law Clerks"),
    ("23-1021", "Administrative Law Judges, Adjudicators, and Hearing Officers"),
    ("23-1022", "Arbitrators, Mediators, and Conciliators"),
    ("23-1023", "Judges, Magistrate Judges, and Magistrates"),
    ("23-2011", "Paralegals and Legal Assistants"),
    ("23-2093", "Title Examiners, Abstractors, and Searchers"),
    ("23-2099", "Legal Support Workers, All Other"),
    # Education (25)
    ("25-1011", "Business Teachers, Postsecondary"),
    ("25-1021", "Computer Science Teachers, Postsecondary"),
    ("25-1022", "Mathematical Science Teachers, Postsecondary"),
    ("25-1032", "Engineering Teachers, Postsecondary"),
    ("25-1042", "Biological Science Teachers, Postsecondary"),
    ("25-1051", "Atmospheric, Earth, Marine, and Space Sciences Teachers, Postsecondary"),
    ("25-1052", "Chemistry Teachers, Postsecondary"),
    ("25-1053", "Environmental Science Teachers, Postsecondary"),
    ("25-1054", "Physics Teachers, Postsecondary"),
    ("25-1061", "Anthropology and Archeology Teachers, Postsecondary"),
    ("25-1062", "Area, Ethnic, and Cultural Studies Teachers, Postsecondary"),
    ("25-1063", "Economics Teachers, Postsecondary"),
    ("25-1065", "Political Science Teachers, Postsecondary"),
    ("25-1066", "Psychology Teachers, Postsecondary"),
    ("25-1067", "Sociology Teachers, Postsecondary"),
    ("25-1071", "Health Specialties Teachers, Postsecondary"),
    ("25-1072", "Nursing Instructors and Teachers, Postsecondary"),
    ("25-1081", "Education Teachers, Postsecondary"),
    ("25-1082", "Library Science Teachers, Postsecondary"),
    ("25-1112", "Law Teachers, Postsecondary"),
    ("25-1113", "Social Work Teachers, Postsecondary"),
    ("25-1121", "Art, Drama, and Music Teachers, Postsecondary"),
    ("25-1122", "Communications Teachers, Postsecondary"),
    ("25-1124", "Foreign Language and Literature Teachers, Postsecondary"),
    ("25-1125", "History Teachers, Postsecondary"),
    ("25-1126", "Philosophy and Religion Teachers, Postsecondary"),
    ("25-1191", "Graduate Teaching Assistants"),
    ("25-1194", "Career/Technical Education Teachers, Postsecondary"),
    ("25-2011", "Preschool Teachers, Except Special Education"),
    ("25-2012", "Kindergarten Teachers, Except Special Education"),
    ("25-2021", "Elementary School Teachers, Except Special Education"),
    ("25-2022", "Middle School Teachers, Except Special and Career/Technical Education"),
    ("25-2031", "Secondary School Teachers, Except Special and Career/Technical Education"),
    ("25-2032", "Career/Technical Education Teachers, Secondary School"),
    ("25-2050", "Special Education Teachers"),
    ("25-2059", "Special Education Teachers, All Other"),
    ("25-3011", "Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors"),
    ("25-3021", "Self-Enrichment Teachers"),
    ("25-3031", "Substitute Teachers, Short-Term"),
    ("25-3041", "Tutors"),
    ("25-4011", "Archivists"),
    ("25-4013", "Museum Technicians and Conservators"),
    ("25-4022", "Librarians and Media Collections Specialists"),
    ("25-4031", "Library Technicians"),
    ("25-9031", "Instructional Coordinators"),
    ("25-9045", "Teaching Assistants, Except Postsecondary"),
    # Arts, Design, Media (27)
    ("27-1011", "Art Directors"),
    ("27-1012", "Craft Artists"),
    ("27-1013", "Fine Artists, Including Painters, Sculptors, and Illustrators"),
    ("27-1014", "Special Effects Artists and Animators"),
    ("27-1021", "Commercial and Industrial Designers"),
    ("27-1022", "Fashion Designers"),
    ("27-1024", "Graphic Designers"),
    ("27-1025", "Interior Designers"),
    ("27-1027", "Set and Exhibit Designers"),
    ("27-2011", "Actors"),
    ("27-2012", "Producers and Directors"),
    ("27-2022", "Coaches and Scouts"),
    ("27-2032", "Choreographers"),
    ("27-2041", "Music Directors and Composers"),
    ("27-2042", "Musicians and Singers"),
    ("27-3011", "Broadcast Announcers and Radio Disc Jockeys"),
    ("27-3023", "News Analysts, Reporters, and Journalists"),
    ("27-3031", "Public Relations Specialists"),
    ("27-3041", "Editors"),
    ("27-3042", "Technical Writers"),
    ("27-3043", "Writers and Authors"),
    ("27-3091", "Interpreters and Translators"),
    ("27-4011", "Audio and Video Technicians"),
    ("27-4014", "Sound Engineering Technicians"),
    ("27-4021", "Photographers"),
    ("27-4032", "Film and Video Editors"),
    # Healthcare Practitioners (29)
    ("29-1011", "Chiropractors"),
    ("29-1021", "Dentists, General"),
    ("29-1031", "Dietitians and Nutritionists"),
    ("29-1041", "Optometrists"),
    ("29-1051", "Pharmacists"),
    ("29-1071", "Physician Assistants"),
    ("29-1122", "Occupational Therapists"),
    ("29-1123", "Physical Therapists"),
    ("29-1124", "Radiation Therapists"),
    ("29-1125", "Recreational Therapists"),
    ("29-1126", "Respiratory Therapists"),
    ("29-1127", "Speech-Language Pathologists"),
    ("29-1128", "Exercise Physiologists"),
    ("29-1131", "Veterinarians"),
    ("29-1141", "Registered Nurses"),
    ("29-1151", "Nurse Anesthetists"),
    ("29-1161", "Nurse Midwives"),
    ("29-1171", "Nurse Practitioners"),
    ("29-1215", "Family Medicine Physicians"),
    ("29-1216", "General Internal Medicine Physicians"),
    ("29-1218", "Obstetricians and Gynecologists"),
    ("29-1221", "Pediatricians, General"),
    ("29-1223", "Psychiatrists"),
    ("29-1228", "Physicians, All Other; and Ophthalmologists, Except Pediatric"),
    ("29-1229", "Surgeons, All Other"),
    ("29-1241", "Ophthalmologists, Except Pediatric"),
    ("29-1242", "Orthopedic Surgeons, Except Pediatric"),
    ("29-1243", "Pediatric Surgeons"),
    ("29-1248", "Surgeons, Except Ophthalmologists"),
    ("29-1292", "Dental Hygienists"),
    ("29-2010", "Clinical Laboratory Technologists and Technicians"),
    ("29-2032", "Diagnostic Medical Sonographers"),
    ("29-2033", "Nuclear Medicine Technologists"),
    ("29-2034", "Radiologic Technologists and Technicians"),
    ("29-2035", "Magnetic Resonance Imaging Technologists"),
    ("29-2041", "Emergency Medical Technicians"),
    ("29-2042", "Paramedics"),
    ("29-2043", "Paramedics"),
    ("29-2051", "Dietetic Technicians"),
    ("29-2052", "Pharmacy Technicians"),
    ("29-2053", "Psychiatric Technicians"),
    ("29-2055", "Surgical Technologists"),
    ("29-2056", "Veterinary Technologists and Technicians"),
    ("29-2061", "Licensed Practical and Licensed Vocational Nurses"),
    ("29-2072", "Medical Records Specialists"),
    ("29-2081", "Opticians, Dispensing"),
    ("29-2091", "Orthotists and Prosthetists"),
    ("29-2099", "Health Technologists and Technicians, All Other"),
    ("29-9021", "Health Information Technologists and Medical Registrars"),
    ("29-9093", "Surgical Assistants"),
    # Healthcare Support (31)
    ("31-1120", "Home Health and Personal Care Aides"),
    ("31-1131", "Nursing Assistants"),
    ("31-1132", "Orderlies"),
    ("31-1133", "Psychiatric Aides"),
    ("31-2011", "Occupational Therapy Assistants"),
    ("31-2012", "Occupational Therapy Aides"),
    ("31-2021", "Physical Therapist Assistants"),
    ("31-2022", "Physical Therapist Aides"),
    ("31-9011", "Massage Therapists"),
    ("31-9091", "Dental Assistants"),
    ("31-9092", "Medical Assistants"),
    ("31-9093", "Medical Equipment Preparers"),
    ("31-9094", "Medical Transcriptionists"),
    ("31-9096", "Veterinary Assistants and Laboratory Animal Caretakers"),
    ("31-9097", "Phlebotomists"),
    # Protective Service (33)
    ("33-1011", "First-Line Supervisors of Correctional Officers"),
    ("33-1012", "First-Line Supervisors of Police and Detectives"),
    ("33-1021", "First-Line Supervisors of Firefighting and Prevention Workers"),
    ("33-2011", "Firefighters"),
    ("33-2021", "Fire Inspectors and Investigators"),
    ("33-3011", "Bailiffs"),
    ("33-3012", "Correctional Officers and Jailers"),
    ("33-3021", "Detectives and Criminal Investigators"),
    ("33-3031", "Fish and Game Wardens"),
    ("33-3041", "Parking Enforcement Workers"),
    ("33-3051", "Police and Sheriff's Patrol Officers"),
    ("33-9011", "Animal Control Workers"),
    ("33-9021", "Private Detectives and Investigators"),
    ("33-9032", "Security Guards"),
    ("33-9091", "Crossing Guards and Flaggers"),
    ("33-9093", "Transportation Security Screeners"),
    # Food Preparation (35)
    ("35-1011", "Chefs and Head Cooks"),
    ("35-1012", "First-Line Supervisors of Food Preparation and Serving Workers"),
    ("35-2011", "Cooks, Fast Food"),
    ("35-2012", "Cooks, Institution and Cafeteria"),
    ("35-2014", "Cooks, Restaurant"),
    ("35-2015", "Cooks, Short Order"),
    ("35-2021", "Food Preparation Workers"),
    ("35-3011", "Bartenders"),
    ("35-3023", "Fast Food and Counter Workers"),
    ("35-3031", "Waiters and Waitresses"),
    ("35-3041", "Food Servers, Nonrestaurant"),
    ("35-9011", "Dining Room and Cafeteria Attendants and Bartender Helpers"),
    ("35-9021", "Dishwashers"),
    ("35-9031", "Hosts and Hostesses, Restaurant, Lounge, and Coffee Shop"),
    # Building and Grounds (37)
    ("37-1011", "First-Line Supervisors of Housekeeping and Janitorial Workers"),
    ("37-1012", "First-Line Supervisors of Landscaping, Lawn Service, and Groundskeeping Workers"),
    ("37-2011", "Janitors and Cleaners, Except Maids and Housekeeping Cleaners"),
    ("37-2012", "Maids and Housekeeping Cleaners"),
    ("37-3011", "Landscaping and Groundskeeping Workers"),
    ("37-3012", "Pesticide Handlers, Sprayers, and Applicators, Vegetation"),
    ("37-3013", "Tree Trimmers and Pruners"),
    # Personal Care (39)
    ("39-1014", "First-Line Supervisors of Entertainment and Recreation Workers"),
    ("39-2011", "Animal Trainers"),
    ("39-2021", "Animal Caretakers"),
    ("39-3012", "Gambling and Sports Book Writers and Runners"),
    ("39-3031", "Ushers, Lobby Attendants, and Ticket Takers"),
    ("39-4011", "Embalmers"),
    ("39-4031", "Morticians, Undertakers, and Funeral Arrangers"),
    ("39-5011", "Barbers"),
    ("39-5012", "Hairdressers, Hairstylists, and Cosmetologists"),
    ("39-5091", "Makeup Artists, Theatrical and Performance"),
    ("39-5092", "Manicurists and Pedicurists"),
    ("39-5093", "Shampooers"),
    ("39-5094", "Skincare Specialists"),
    ("39-7010", "Tour and Travel Guides"),
    ("39-9011", "Childcare Workers"),
    ("39-9031", "Exercise Trainers and Group Fitness Instructors"),
    ("39-9032", "Recreation Workers"),
    ("39-9041", "Residential Advisors"),
    # Sales (41)
    ("41-1011", "First-Line Supervisors of Retail Sales Workers"),
    ("41-1012", "First-Line Supervisors of Non-Retail Sales Workers"),
    ("41-2011", "Cashiers"),
    ("41-2021", "Counter and Rental Clerks"),
    ("41-2031", "Retail Salespersons"),
    ("41-3011", "Advertising Sales Agents"),
    ("41-3021", "Insurance Sales Agents"),
    ("41-3031", "Securities, Commodities, and Financial Services Sales Agents"),
    ("41-3041", "Travel Agents"),
    ("41-4012", "Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products"),
    ("41-9011", "Demonstrators and Product Promoters"),
    ("41-9021", "Real Estate Brokers"),
    ("41-9022", "Real Estate Sales Agents"),
    ("41-9031", "Sales Engineers"),
    ("41-9041", "Telemarketers"),
    # Office and Admin Support (43)
    ("43-1011", "First-Line Supervisors of Office and Administrative Support Workers"),
    ("43-2011", "Switchboard Operators, Including Answering Service"),
    ("43-3011", "Bill and Account Collectors"),
    ("43-3021", "Billing and Posting Clerks"),
    ("43-3031", "Bookkeeping, Accounting, and Auditing Clerks"),
    ("43-3051", "Payroll and Timekeeping Clerks"),
    ("43-3061", "Procurement Clerks"),
    ("43-3071", "Tellers"),
    ("43-4011", "Brokerage Clerks"),
    ("43-4021", "Correspondence Clerks"),
    ("43-4031", "Court, Municipal, and License Clerks"),
    ("43-4041", "Credit Authorizers, Checkers, and Clerks"),
    ("43-4051", "Customer Service Representatives"),
    ("43-4061", "Eligibility Interviewers, Government Programs"),
    ("43-4071", "File Clerks"),
    ("43-4081", "Hotel, Motel, and Resort Desk Clerks"),
    ("43-4111", "Interviewers, Except Eligibility and Loan"),
    ("43-4121", "Library Assistants, Clerical"),
    ("43-4131", "Loan Interviewers and Clerks"),
    ("43-4141", "New Accounts Clerks"),
    ("43-4151", "Order Clerks"),
    ("43-4161", "Human Resources Assistants, Except Payroll and Timekeeping"),
    ("43-4171", "Receptionists and Information Clerks"),
    ("43-4181", "Reservation and Transportation Ticket Agents and Travel Clerks"),
    ("43-4199", "Information and Record Clerks, All Other"),
    ("43-5011", "Cargo and Freight Agents"),
    ("43-5021", "Couriers and Messengers"),
    ("43-5031", "Public Safety Telecommunicators"),
    ("43-5032", "Dispatchers, Except Police, Fire, and Ambulance"),
    ("43-5041", "Meter Readers, Utilities"),
    ("43-5051", "Postal Service Clerks"),
    ("43-5052", "Postal Service Mail Carriers"),
    ("43-5053", "Postal Service Mail Sorters, Processors, and Processing Machine Operators"),
    ("43-5061", "Production, Planning, and Expediting Clerks"),
    ("43-5071", "Shipping, Receiving, and Inventory Clerks"),
    ("43-5111", "Weighers, Measurers, Checkers, and Samplers, Recordkeeping"),
    ("43-6011", "Executive Secretaries and Executive Administrative Assistants"),
    ("43-6012", "Legal Secretaries and Administrative Assistants"),
    ("43-6013", "Medical Secretaries and Administrative Assistants"),
    ("43-6014", "Secretaries and Administrative Assistants, Except Legal, Medical, and Executive"),
    ("43-9011", "Computer Operators"),
    ("43-9021", "Data Entry Keyers"),
    ("43-9022", "Word Processors and Typists"),
    ("43-9041", "Insurance Claims and Policy Processing Clerks"),
    ("43-9051", "Mail Clerks and Mail Machine Operators, Except Postal Service"),
    ("43-9061", "Office Clerks, General"),
    ("43-9071", "Office Machine Operators, Except Computer"),
    ("43-9111", "Statistical Assistants"),
    # Construction (47)
    ("47-1011", "First-Line Supervisors of Construction Trades and Extraction Workers"),
    ("47-2011", "Boilermakers"),
    ("47-2021", "Brickmasons and Blockmasons"),
    ("47-2031", "Carpenters"),
    ("47-2041", "Carpet Installers"),
    ("47-2042", "Floor Layers, Except Carpet, Wood, and Hard Tiles"),
    ("47-2043", "Floor Sanders and Finishers"),
    ("47-2044", "Tile and Stone Setters"),
    ("47-2051", "Cement Masons and Concrete Finishers"),
    ("47-2061", "Construction Laborers"),
    ("47-2071", "Paving, Surfacing, and Tamping Equipment Operators"),
    ("47-2072", "Pile Driver Operators"),
    ("47-2073", "Operating Engineers and Other Construction Equipment Operators"),
    ("47-2081", "Drywall and Ceiling Tile Installers"),
    ("47-2111", "Electricians"),
    ("47-2121", "Glaziers"),
    ("47-2131", "Insulation Workers, Floor, Ceiling, and Wall"),
    ("47-2132", "Insulation Workers, Mechanical"),
    ("47-2141", "Painters, Construction and Maintenance"),
    ("47-2151", "Pipelayers"),
    ("47-2152", "Plumbers, Pipefitters, and Steamfitters"),
    ("47-2161", "Plasterers and Stucco Masons"),
    ("47-2171", "Reinforcing Iron and Rebar Workers"),
    ("47-2181", "Roofers"),
    ("47-2211", "Sheet Metal Workers"),
    ("47-2221", "Structural Iron and Steel Workers"),
    ("47-2231", "Solar Photovoltaic Installers"),
    ("47-3011", "Helpers--Brickmasons, Blockmasons, Stonemasons, and Tile and Marble Setters"),
    ("47-3012", "Helpers--Carpenters"),
    ("47-3013", "Helpers--Electricians"),
    ("47-3014", "Helpers--Painters, Paperhangers, Plasterers, and Stucco Masons"),
    ("47-3015", "Helpers--Pipelayers, Plumbers, Pipefitters, and Steamfitters"),
    ("47-3016", "Helpers--Roofers"),
    ("47-4011", "Construction and Building Inspectors"),
    ("47-4021", "Elevator and Escalator Installers and Repairers"),
    ("47-4041", "Hazardous Materials Removal Workers"),
    ("47-4051", "Highway Maintenance Workers"),
    ("47-4061", "Rail-Track Laying and Maintenance Equipment Operators"),
    ("47-5012", "Rotary Drill Operators, Oil and Gas"),
    ("47-5013", "Service Unit Operators, Oil and Gas"),
    ("47-5023", "Earth Drillers, Except Oil and Gas"),
    ("47-5032", "Explosives Workers, Ordnance Handling Experts, and Blasters"),
    ("47-5041", "Continuous Mining Machine Operators"),
    ("47-5043", "Roof Bolters, Mining"),
    # Installation and Maintenance (49)
    ("49-1011", "First-Line Supervisors of Mechanics, Installers, and Repairers"),
    ("49-2011", "Computer, Automated Teller, and Office Machine Repairers"),
    ("49-2022", "Telecommunications Equipment Installers and Repairers, Except Line Installers"),
    ("49-2091", "Avionics Technicians"),
    ("49-2094", "Electrical and Electronics Repairers, Commercial and Industrial Equipment"),
    ("49-2095", "Electrical and Electronics Repairers, Powerhouse, Substation, and Relay"),
    ("49-2097", "Audiovisual Equipment Installers and Repairers"),
    ("49-2098", "Security and Fire Alarm Systems Installers"),
    ("49-3011", "Aircraft Mechanics and Service Technicians"),
    ("49-3021", "Automotive Body and Related Repairers"),
    ("49-3023", "Automotive Service Technicians and Mechanics"),
    ("49-3031", "Bus and Truck Mechanics and Diesel Engine Specialists"),
    ("49-3042", "Mobile Heavy Equipment Mechanics, Except Engines"),
    ("49-3043", "Rail Car Repairers"),
    ("49-3053", "Outdoor Power Equipment and Other Small Engine Mechanics"),
    ("49-9012", "Control and Valve Installers and Repairers, Except Mechanical Door"),
    ("49-9021", "Heating, Air Conditioning, and Refrigeration Mechanics and Installers"),
    ("49-9031", "Home Appliance Repairers"),
    ("49-9041", "Industrial Machinery Mechanics"),
    ("49-9043", "Maintenance Workers, Machinery"),
    ("49-9044", "Millwrights"),
    ("49-9051", "Electrical Power-Line Installers and Repairers"),
    ("49-9052", "Telecommunications Line Installers and Repairers"),
    ("49-9062", "Medical Equipment Repairers"),
    ("49-9071", "Maintenance and Repair Workers, General"),
    ("49-9081", "Wind Turbine Service Technicians"),
    ("49-9098", "Helpers--Installation, Maintenance, and Repair Workers"),
    # Production (51)
    ("51-1011", "First-Line Supervisors of Production and Operating Workers"),
    ("51-2041", "Structural Metal Fabricators and Fitters"),
    ("51-2051", "Fiberglass Laminators and Fabricators"),
    ("51-2090", "Miscellaneous Assemblers and Fabricators"),
    ("51-3011", "Bakers"),
    ("51-3021", "Butchers and Meat Cutters"),
    ("51-3022", "Meat, Poultry, and Fish Cutters and Trimmers"),
    ("51-3023", "Slaughterers and Meat Packers"),
    ("51-3091", "Food and Tobacco Roasting, Baking, and Drying Machine Operators and Tenders"),
    ("51-3092", "Food Batchmakers"),
    ("51-3093", "Food Cooking Machine Operators and Tenders"),
    ("51-4011", "Computer Numerically Controlled Tool Operators"),
    ("51-4012", "Computer Numerically Controlled Tool Programmers"),
    ("51-4021", "Extruding and Drawing Machine Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4022", "Forging Machine Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4023", "Rolling Machine Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4031", "Cutting, Punching, and Press Machine Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4032", "Drilling and Boring Machine Tool Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4033", "Grinding, Lapping, Polishing, and Buffing Machine Tool Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4034", "Lathe and Turning Machine Tool Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4041", "Machinists"),
    ("51-4051", "Metal-Refining Furnace Operators and Tenders"),
    ("51-4052", "Pourers and Casters, Metal"),
    ("51-4061", "Model Makers, Metal and Plastic"),
    ("51-4071", "Foundry Mold and Coremakers"),
    ("51-4072", "Molding, Coremaking, and Casting Machine Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4081", "Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic"),
    ("51-4111", "Tool and Die Makers"),
    ("51-4121", "Welders, Cutters, Solderers, and Brazers"),
    ("51-4122", "Welding, Soldering, and Brazing Machine Setters, Operators, and Tenders"),
    ("51-5111", "Prepress Technicians and Workers"),
    ("51-5112", "Printing Press Operators"),
    ("51-5113", "Print Binding and Finishing Workers"),
    ("51-6011", "Laundry and Dry-Cleaning Workers"),
    ("51-6021", "Pressers, Textile, Garment, and Related Materials"),
    ("51-6031", "Sewing Machine Operators"),
    ("51-6041", "Shoe and Leather Workers and Repairers"),
    ("51-6051", "Sewers, Hand"),
    ("51-6061", "Textile Bleaching and Dyeing Machine Operators and Tenders"),
    ("51-6062", "Textile Cutting Machine Setters, Operators, and Tenders"),
    ("51-6063", "Textile Knitting and Weaving Machine Setters, Operators, and Tenders"),
    ("51-6064", "Textile Winding, Twisting, and Drawing Out Machine Setters, Operators, and Tenders"),
    ("51-6093", "Upholsterers"),
    ("51-7011", "Cabinetmakers and Bench Carpenters"),
    ("51-7042", "Woodworking Machine Setters, Operators, and Tenders, Except Sawing"),
    ("51-8011", "Nuclear Power Reactor Operators"),
    ("51-8012", "Power Distributors and Dispatchers"),
    ("51-8013", "Power Plant Operators"),
    ("51-8021", "Stationary Engineers and Boiler Operators"),
    ("51-8031", "Water and Wastewater Treatment Plant and System Operators"),
    ("51-8091", "Chemical Plant and System Operators"),
    ("51-8092", "Gas Plant Operators"),
    ("51-8093", "Petroleum Pump System Operators, Refinery Operators, and Gaugers"),
    ("51-8099", "Plant and System Operators, All Other"),
    ("51-9011", "Chemical Equipment Operators and Tenders"),
    ("51-9012", "Separating, Filtering, Clarifying, Precipitating, and Still Machine Setters, Operators, and Tenders"),
    ("51-9021", "Crushing, Grinding, and Polishing Machine Setters, Operators, and Tenders"),
    ("51-9023", "Mixing and Blending Machine Setters, Operators, and Tenders"),
    ("51-9032", "Cutting and Slicing Machine Setters, Operators, and Tenders"),
    ("51-9041", "Extruding, Forming, Pressing, and Compacting Machine Setters, Operators, and Tenders"),
    ("51-9051", "Furnace, Kiln, Oven, Drier, and Kettle Operators and Tenders"),
    ("51-9061", "Inspectors, Testers, Sorters, Samplers, and Weighers"),
    ("51-9071", "Jewelers and Precious Stone and Metal Workers"),
    ("51-9081", "Dental Laboratory Technicians"),
    ("51-9082", "Medical Appliance Technicians"),
    ("51-9083", "Ophthalmic Laboratory Technicians"),
    ("51-9111", "Packaging and Filling Machine Operators and Tenders"),
    ("51-9123", "Painting, Coating, and Decorating Workers"),
    ("51-9124", "Coating, Painting, and Spraying Machine Setters, Operators, and Tenders"),
    ("51-9141", "Semiconductor Processing Technicians"),
    ("51-9151", "Photographic Process Workers and Processing Machine Operators"),
    ("51-9195", "Molders, Shapers, and Casters, Except Metal and Plastic"),
    ("51-9198", "Helpers--Production Workers"),
    # Transportation (53)
    ("53-1042", "First-Line Supervisors of Helpers, Laborers, and Material Movers, Hand"),
    ("53-1043", "First-Line Supervisors of Material-Moving Machine and Vehicle Operators"),
    ("53-1044", "First-Line Supervisors of Passenger Attendants"),
    ("53-2011", "Airline Pilots, Copilots, and Flight Engineers"),
    ("53-2012", "Commercial Pilots"),
    ("53-2021", "Air Traffic Controllers"),
    ("53-2031", "Flight Attendants"),
    ("53-3011", "Ambulance Drivers and Attendants, Except Emergency Medical Technicians"),
    ("53-3032", "Heavy and Tractor-Trailer Truck Drivers"),
    ("53-3033", "Light Truck Drivers"),
    ("53-3051", "Bus Drivers, Transit and Intercity"),
    ("53-3052", "Bus Drivers, School"),
    ("53-3053", "Shuttle Drivers and Chauffeurs"),
    ("53-3054", "Taxi Drivers"),
    ("53-3058", "Passenger Vehicle Drivers, Except Bus Drivers, Transit and Intercity"),
    ("53-4011", "Locomotive Engineers"),
    ("53-4013", "Rail Yard Engineers, Dinkey Operators, and Hostlers"),
    ("53-4021", "Railroad Brake, Signal, and Switch Operators and Locomotive Firers"),
    ("53-4022", "Railroad Conductors and Yardmasters"),
    ("53-4031", "Railroad Conductors and Yardmasters"),
    ("53-5011", "Sailors and Marine Oilers"),
    ("53-5021", "Captains, Mates, and Pilots of Water Vessels"),
    ("53-5022", "Motorboat Operators"),
    ("53-6011", "Bridge and Lock Tenders"),
    ("53-6021", "Parking Attendants"),
    ("53-6031", "Automotive and Watercraft Service Attendants"),
    ("53-6051", "Transportation Inspectors"),
    ("53-6061", "Passenger Attendants"),
    ("53-7011", "Conveyor Operators and Tenders"),
    ("53-7021", "Crane and Tower Operators"),
    ("53-7031", "Dredge Operators"),
    ("53-7032", "Excavating and Loading Machine and Dragline Operators, Surface Mining"),
    ("53-7041", "Hoist and Winch Operators"),
    ("53-7051", "Industrial Truck and Tractor Operators"),
    ("53-7061", "Cleaners of Vehicles and Equipment"),
    ("53-7062", "Laborers and Freight, Stock, and Material Movers, Hand"),
    ("53-7063", "Machine Feeders and Offbearers"),
    ("53-7064", "Packers and Packagers, Hand"),
    ("53-7065", "Stockers and Order Fillers"),
]

# Same top 50 metros + national
TOP_AREAS = [
    ("0000000", "National"),
    ("0035620", "New York"),
    ("0031080", "Los Angeles"),
    ("0016980", "Chicago"),
    ("0019100", "Dallas"),
    ("0026420", "Houston"),
    ("0047900", "Washington DC"),
    ("0033100", "Miami"),
    ("0037980", "Philadelphia"),
    ("0012060", "Atlanta"),
    ("0014460", "Boston"),
    ("0038060", "Phoenix"),
    ("0041860", "San Francisco"),
    ("0040140", "Riverside"),
    ("0019820", "Detroit"),
    ("0042660", "Seattle"),
    ("0033460", "Minneapolis"),
    ("0041740", "San Diego"),
    ("0045300", "Tampa"),
    ("0019740", "Denver"),
    ("0041180", "St. Louis"),
    ("0012580", "Baltimore"),
    ("0036740", "Orlando"),
    ("0016740", "Charlotte"),
    ("0041940", "San Jose"),
    ("0040900", "Sacramento"),
    ("0038900", "Portland"),
    ("0038300", "Pittsburgh"),
    ("0012420", "Austin"),
    ("0029820", "Las Vegas"),
    ("0017460", "Cincinnati"),
    ("0028140", "Kansas City"),
    ("0018140", "Columbus"),
    ("0026900", "Indianapolis"),
    ("0017140", "Cleveland"),
    ("0041700", "San Antonio"),
    ("0034980", "Nashville"),
    ("0046060", "Tucson"),
    ("0027260", "Jacksonville"),
    ("0036420", "Oklahoma City"),
    ("0039300", "Providence"),
    ("0040060", "Richmond"),
    ("0032820", "Memphis"),
    ("0031140", "Louisville"),
    ("0040380", "Rochester"),
    ("0039580", "Raleigh"),
    ("0025540", "Hartford"),
    ("0035380", "New Orleans"),
    ("0041620", "Salt Lake City"),
    ("0013820", "Birmingham"),
    ("0015380", "Buffalo"),
]

DATATYPES = {
    '01': 'employment',
    '04': 'annual_mean',
    '11': 'annual_p10',
    '12': 'annual_p25',
    '13': 'annual_median',
    '14': 'annual_p75',
    '15': 'annual_p90',
}

MAJOR_GROUPS = {
    '11': 'Management',
    '13': 'Business and Financial Operations',
    '15': 'Computer and Mathematical',
    '17': 'Architecture and Engineering',
    '19': 'Life, Physical, and Social Science',
    '21': 'Community and Social Service',
    '23': 'Legal',
    '25': 'Educational Instruction and Library',
    '27': 'Arts, Design, Entertainment, Sports, and Media',
    '29': 'Healthcare Practitioners and Technical',
    '31': 'Healthcare Support',
    '33': 'Protective Service',
    '35': 'Food Preparation and Serving Related',
    '37': 'Building and Grounds Cleaning and Maintenance',
    '39': 'Personal Care and Service',
    '41': 'Sales and Related',
    '43': 'Office and Administrative Support',
    '45': 'Farming, Fishing, and Forestry',
    '47': 'Construction and Extraction',
    '49': 'Installation, Maintenance, and Repair',
    '51': 'Production',
    '53': 'Transportation and Material Moving',
}


def slugify(text):
    text = text.lower()
    text = re.sub(r'[,()\']', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {'fetched_occupations': [], 'queries_today': 0, 'last_date': ''}


def save_progress(progress):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)


def fetch_series(series_ids):
    payload = {
        'seriesid': series_ids,
        'startyear': '2023',
        'endyear': '2024',
        'registrationkey': API_KEY,
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(API_URL, data=data, headers={
        'Content-Type': 'application/json',
        'User-Agent': 'salary-data/1.0',
    })
    resp = urllib.request.urlopen(req, timeout=60)
    result = json.loads(resp.read())

    if result.get('status') != 'REQUEST_SUCCEEDED':
        msgs = result.get('message', [])
        for msg in msgs:
            if 'threshold' in str(msg).lower():
                raise RuntimeError('DAILY_LIMIT')
            if 'invalid' in str(msg).lower():
                raise RuntimeError(f'API key error: {msg}')
        return {}

    parsed = {}
    for series in result.get('Results', {}).get('series', []):
        sid = series['seriesID']
        for d in series.get('data', []):
            if d.get('period') == 'A01':
                val = d.get('value', '')
                if val and val not in ('*', '#', '**', 'N'):
                    try:
                        parsed[sid] = float(val.replace(',', ''))
                    except ValueError:
                        pass
    return parsed


def main():
    from datetime import date
    today = date.today().isoformat()

    progress = load_progress()

    # Reset daily counter if new day
    if progress['last_date'] != today:
        progress['queries_today'] = 0
        progress['last_date'] = today

    fetched = set(progress['fetched_occupations'])
    remaining = [(soc, title) for soc, title in ALL_OCCUPATIONS if soc not in fetched]

    print(f'=== Expand Occupations ===')
    print(f'Total occupations: {len(ALL_OCCUPATIONS)}')
    print(f'Already fetched: {len(fetched)}')
    print(f'Remaining: {len(remaining)}')
    print(f'Queries used today: {progress["queries_today"]}/{MAX_QUERIES}')

    if not remaining:
        print('\nAll occupations fetched! Nothing to do.')
        return

    if progress['queries_today'] >= MAX_QUERIES:
        print('\nDaily limit reached. Run again tomorrow.')
        return

    # Open DB
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    queries_made = progress['queries_today']
    new_records = 0

    for soc, title in remaining:
        if queries_made >= MAX_QUERIES:
            print(f'\n  Daily limit reached ({queries_made}/{MAX_QUERIES}). Run again tomorrow.')
            break

        # Insert occupation if not exists
        prefix = soc[:2]
        mg_code = f'{prefix}-0000'
        mg_title = MAJOR_GROUPS.get(prefix, 'Other')
        slug = slugify(title)
        c.execute('INSERT OR IGNORE INTO occupations (soc_code, title, major_group, major_group_title, slug) VALUES (?,?,?,?,?)',
                  (soc, title, mg_code, mg_title, slug))

        # Build series for all areas
        all_series = []
        for area_code, _ in TOP_AREAS:
            area_type = 'N' if area_code == '0000000' else 'M'
            for dt in DATATYPES:
                soc_nodash = soc.replace('-', '')
                sid = f'OEU{area_type}{area_code}000000{soc_nodash}{dt}'
                all_series.append((sid, soc, area_code, dt))

        # Fetch in batches
        wage_data = {}
        print(f'  {soc} {title[:40]}...', end=' ', flush=True)

        for i in range(0, len(all_series), MAX_SERIES):
            batch = all_series[i:i + MAX_SERIES]
            batch_ids = [s[0] for s in batch]

            queries_made += 1
            try:
                results = fetch_series(batch_ids)
                for sid, s, area_code, dt in batch:
                    if sid in results:
                        key = (s, area_code)
                        if key not in wage_data:
                            wage_data[key] = {}
                        wage_data[key][DATATYPES[dt]] = results[sid]
            except RuntimeError as e:
                if 'DAILY_LIMIT' in str(e):
                    print(f'LIMIT')
                    queries_made = MAX_QUERIES
                    break
                raise
            except Exception as e:
                print(f'ERR:{e}', end=' ')

            time.sleep(0.25)

        # Insert wage data
        occ_records = 0
        for (s, area_code), values in wage_data.items():
            median = values.get('annual_median')
            mean = values.get('annual_mean')
            if median is None and mean is None:
                continue
            c.execute('''INSERT OR REPLACE INTO wages
                (soc_code, area_code, employment, annual_mean, annual_median,
                 annual_p10, annual_p25, annual_p75, annual_p90,
                 hourly_mean, hourly_median, year)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 2024)''',
                (s, area_code,
                 int(values['employment']) if values.get('employment') else None,
                 int(values['annual_mean']) if values.get('annual_mean') else None,
                 int(median) if median else None,
                 int(values['annual_p10']) if values.get('annual_p10') else None,
                 int(values['annual_p25']) if values.get('annual_p25') else None,
                 int(values['annual_p75']) if values.get('annual_p75') else None,
                 int(values['annual_p90']) if values.get('annual_p90') else None,
                ))
            occ_records += 1

        print(f'{occ_records} records')
        new_records += occ_records

        # Mark as fetched
        fetched.add(soc)
        progress['fetched_occupations'] = list(fetched)
        progress['queries_today'] = queries_made

        conn.commit()
        save_progress(progress)

    conn.commit()

    # Summary
    total_occ = c.execute('SELECT COUNT(*) FROM occupations').fetchone()[0]
    total_wages = c.execute('SELECT COUNT(*) FROM wages').fetchone()[0]
    print(f'\n=== Summary ===')
    print(f'  Occupations in DB: {total_occ}')
    print(f'  Total wage records: {total_wages}')
    print(f'  New records today: {new_records}')
    print(f'  Queries used: {queries_made}/{MAX_QUERIES}')
    print(f'  Remaining occupations: {len(ALL_OCCUPATIONS) - len(fetched)}')

    if len(ALL_OCCUPATIONS) - len(fetched) > 0:
        days_needed = ((len(ALL_OCCUPATIONS) - len(fetched)) * 8) // MAX_QUERIES + 1
        print(f'  Estimated days to complete: {days_needed}')

    conn.close()


if __name__ == '__main__':
    main()
