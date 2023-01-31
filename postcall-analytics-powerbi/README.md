
# Visualizing the Batch Analytics output in Power BI

## Setup Guide

The following guide describes how you can create Power BI reports from templates that help realize the value of the call batch analytics output. 

## Prerequisites

A working version of the [call-batch-analytics](../call-batch-analytics/README.md) as well as [Power BI Desktop](aka.ms/PowerBIDownload) installed for free on your machine.

Make sure you have also downloaded a copy of the report you would like to use:

 - [Speech Insights](SpeechInsights.pbit)
 - [Sentiment Insights](SentimentInsights.pbit)

## Power BI Desktop Setup Instructions

1. Ensure that you have downloaded and installed Power BI Desktop before beginning this guide. Navigate to and double click on the .pbit you downloaded. With Power BI Desktop installed properly, this should automatically load the program.

![Loading Power BI Desktop](../common/images/loadingPBI.png)

2. After Power BI Desktop has finished loading, it will prompt you to enter SQL server and database information. These are the values you declare during your ARM Template deployment, but can also be found in the Overview page of the SQL Database in your Azure Portal. Enter these values and click Load.

![Power BI Desktop asking for information](../common/images/enterInfo.png)

Enter Azure SQL DB server details. You can get this from Azure portal:

![Finding SQL server and database names](../common/images/sqlInfo.png)

3. Power BI Desktop will then display a pop up that shows a Refresh of the SQL database occurring. After a few seconds, another window will appear and prompt you to enter in credentials to access your SQL database. Select Database as the credential type, and enter the user name and password you specified during the ARM template deployment of the accelerator. Then, click Connect and wait for the Refresh to complete.

![Power BI Desktop shows data refreshing](../common/images/refreshDB.png)

Enter Azure SQL DB credentials. You can get this from Azure portal:

![Power BI Desktop prompting for credentials](../common/images/dbCreds.png)

4. You should now be looking at the Cover page of the Power BI report template you opened. You can navigate across pages using the tabs at the bottom, or simply control+click on the boxes on the right hand side. Feel free to customize visuals, add new pages, and change the look and feel to match your organization. Enjoy!

![Power BI Desktop shows data refreshing](../common/images/cover.png)


